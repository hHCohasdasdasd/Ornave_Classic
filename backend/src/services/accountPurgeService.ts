import { PrismaClient } from '@prisma/client';
import { supabaseAdmin, FILES_BUCKET } from '../utils/supabaseStorage';
import { PlaidService } from './plaidService';
import { StripeService } from './stripeService';
import { MembershipService } from './membershipService';

const prisma = new PrismaClient();

const PURGE_AFTER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Runs 30 days after a self-service account deletion (AuthService.deleteAccount,
 * which only anonymizes the User row) and hard-deletes everything that's
 * purely the deleted user's own content — posts, comments, likes,
 * publications, Work Suite data, personal files, saved cards/addresses,
 * network connections and group memberships.
 *
 * Deliberately left untouched: Orders, GlobalPayments, GlobalRequests,
 * UserDocuments, UserCompanyConnections (and the Ticket/ConnectionMessage
 * threads that hang off them), DirectMessages, and connection-scoped
 * UserFiles (connectionId set). All of these are shared with a company or
 * another user who has a legitimate reason to keep their side of the
 * record — hard-deleting the User row itself would cascade-destroy those
 * too, which is exactly why the User row is kept (anonymized) forever
 * instead of ever being deleted outright.
 */
export class AccountPurgeService {
  static async purgeExpiredDeletedAccounts(): Promise<{ purged: number; skipped: number }> {
    const cutoff = new Date(Date.now() - PURGE_AFTER_MS);
    const candidates = await prisma.user.findMany({
      where: { deletedAt: { not: null, lte: cutoff }, purgedAt: null },
      select: { id: true, subscriptionActive: true },
    });

    let purged = 0;
    let skipped = 0;
    for (const user of candidates) {
      if (user.subscriptionActive) {
        skipped++;
        continue;
      }
      await this.purgeUser(user.id);
      purged++;
    }

    if (purged || skipped) {
      console.log(`[AccountPurge] Purged ${purged} account(s), skipped ${skipped} (active subscription).`);
    }

    return { purged, skipped };
  }

  private static async purgeUser(userId: string): Promise<void> {
    // Personal cloud-storage objects — connection-scoped files (connectionId
    // set) are excluded, since a company may have uploaded real business
    // documents through that connection.
    const personalFiles = await prisma.userFile.findMany({
      where: { userId, connectionId: null },
      select: { storageKey: true },
    });
    if (personalFiles.length && supabaseAdmin) {
      await supabaseAdmin.storage
        .from(FILES_BUCKET)
        .remove(personalFiles.map((f) => f.storageKey))
        .catch((err) => console.error(`[AccountPurge] Failed to remove storage objects for user ${userId}:`, err));
    }

    // Revoke each bank connection at Plaid before wiping the local rows —
    // this is normally already a no-op by purge time, since deleteAccount
    // revokes immediately rather than waiting for the 30-day window.
    const bankConnections = await prisma.bankConnection.findMany({ where: { userId }, select: { id: true } });
    for (const conn of bankConnections) {
      await PlaidService.removeConnection(userId, conn.id).catch((err) =>
        console.error(`[AccountPurge] Failed to revoke bank connection ${conn.id}:`, err)
      );
    }

    // Same reasoning as the Plaid revocation above — normally already a
    // no-op by purge time, since deleteAccount detaches immediately.
    await StripeService.detachAllPaymentMethods(userId).catch((err) =>
      console.error(`[AccountPurge] Failed to detach Stripe payment methods for user ${userId}:`, err)
    );
    await MembershipService.cancelSubscriptionForDeletion(userId).catch((err) =>
      console.error(`[AccountPurge] Failed to cancel membership subscription for user ${userId}:`, err)
    );

    await prisma.$transaction([
      prisma.post.deleteMany({ where: { authorId: userId } }),
      prisma.comment.deleteMany({ where: { authorId: userId } }),
      prisma.postLike.deleteMany({ where: { userId } }),
      prisma.publication.deleteMany({ where: { authorId: userId } }),
      prisma.publicationComment.deleteMany({ where: { authorId: userId } }),
      prisma.project.deleteMany({ where: { userId } }),
      prisma.task.deleteMany({ where: { userId } }),
      prisma.goal.deleteMany({ where: { userId } }),
      prisma.achievement.deleteMany({ where: { userId } }),
      prisma.note.deleteMany({ where: { userId } }),
      prisma.jobApplication.deleteMany({ where: { userId } }),
      prisma.calendarEvent.deleteMany({ where: { userId } }),
      prisma.financeEntry.deleteMany({ where: { userId } }),
      prisma.manualOrder.deleteMany({ where: { userId } }),
      prisma.workProfile.deleteMany({ where: { userId } }),
      prisma.focusSession.deleteMany({ where: { userId } }),
      prisma.userFile.deleteMany({ where: { userId, connectionId: null } }),
      prisma.userFolder.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.savedCard.deleteMany({ where: { userId } }),
      prisma.savedBankAccount.deleteMany({ where: { userId } }),
      prisma.savedAddress.deleteMany({ where: { userId } }),
      prisma.userConnection.deleteMany({ where: { OR: [{ requesterId: userId }, { addresseeId: userId }] } }),
      prisma.groupMember.deleteMany({ where: { userId } }),
      prisma.eventRsvp.deleteMany({ where: { userId } }),
      prisma.eventSave.deleteMany({ where: { userId } }),
      prisma.userProfile.deleteMany({ where: { userId } }),
      prisma.user.update({ where: { id: userId }, data: { purgedAt: new Date() } }),
    ]);

    const purgedUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    await prisma.authAuditLog.create({
      data: { eventType: 'ACCOUNT_PURGED', email: purgedUser?.email || userId, userId },
    }).catch((err) => console.error(`[AccountPurge] Failed to record audit log for user ${userId}:`, err));
  }
}
