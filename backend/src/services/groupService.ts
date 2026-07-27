import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function tagify(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '');
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  createdById: string;
}

export class GroupService {
  /**
   * A "completed" profile means the user has actually filled something in —
   * not just registered an account. Used to gate sector creation so the
   * directory isn't full of sectors from throwaway/empty accounts.
   */
  static async hasCompletedProfile(userId: string): Promise<boolean> {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) return false;
    return !!(profile.headline?.trim() || profile.bio?.trim() || profile.avatarUrl?.trim());
  }

  /**
   * Create a group. The creator is automatically added as an ADMIN member.
   * Slug/tag are derived from the name, with a numeric suffix on collision.
   */
  static async createGroup(request: CreateGroupRequest) {
    const baseSlug = slugify(request.name) || 'group';
    const baseTag = tagify(request.name) || 'GROUP';

    let slug = baseSlug;
    let tag = baseTag;
    let suffix = 1;
    while (await prisma.group.findFirst({ where: { OR: [{ slug }, { tag }] } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
      tag = `${baseTag}_${suffix}`;
    }

    const group = await prisma.group.create({
      data: {
        name: request.name.trim(),
        slug,
        tag,
        description: request.description,
        createdById: request.createdById,
        members: {
          create: { userId: request.createdById, role: 'ADMIN' },
        },
      },
    });

    return this.formatGroup(group, request.createdById);
  }

  static async listGroups(currentUserId?: string, search?: string) {
    const groups = await prisma.group.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { tag: { contains: search.toUpperCase() } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(groups.map((g) => this.formatGroup(g, currentUserId)));
  }

  static async getGroupBySlug(slug: string, currentUserId?: string) {
    const group = await prisma.group.findUnique({ where: { slug } });
    if (!group) return null;
    return this.formatGroup(group, currentUserId);
  }

  static async getGroupById(id: string) {
    return prisma.group.findUnique({ where: { id } });
  }

  static async joinGroup(groupId: string, userId: string) {
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) return existing;

    return prisma.groupMember.create({
      data: { groupId, userId, role: 'MEMBER' },
    });
  }

  static async leaveGroup(groupId: string, userId: string) {
    await prisma.groupMember.deleteMany({ where: { groupId, userId } });
    return true;
  }

  static async isMember(groupId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    return !!member;
  }

  static async getMembers(groupId: string) {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { include: { profile: true, company: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      user: {
        id: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        headline: m.user.profile?.headline,
        profilePicture: m.user.profile?.avatarUrl,
        companyName: m.user.company?.name,
      },
    }));
  }

  private static async formatGroup(group: any, currentUserId?: string) {
    const memberCount = await prisma.groupMember.count({ where: { groupId: group.id } });
    const isMember = await this.isMember(group.id, currentUserId);

    return {
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      tag: group.tag,
      coverImage: group.coverImage,
      createdById: group.createdById,
      createdAt: group.createdAt.toISOString(),
      memberCount,
      isMember,
    };
  }
}
