import { PrismaClient } from '@prisma/client';
import { PasswordManager } from '../utils/passwordManager';
import { TokenManager } from '../utils/tokenManager';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

// User role constants (replaced enums for SQLite compatibility)
export const UserRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  USER: 'USER',
} as const;

export const UserType = {
  USER: 'USER',
  COMPANY_USER: 'COMPANY_USER',
} as const;

/**
 * Authentication Service
 * Handles user registration, login, and token management
 * Enforces multi-tenancy through company-based isolation
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  companyId?: string;
  companyName?: string;
  userType?: keyof typeof UserType;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    memberNumber: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId?: string | null;
    userType: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: Date;
  } | null;
}

export class AuthService {
  /**
   * Register new user
   * If no companyId provided, creates a new company for the user
   * First user in company automatically becomes OWNER
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    const accountType = data.userType || UserType.COMPANY_USER;
    let companyId = data.companyId;

    if (accountType === UserType.COMPANY_USER) {
      // If no company ID provided, create a new company
      if (!companyId) {
        if (!data.companyName) {
          throw new Error('Either companyId or companyName must be provided');
        }

        const slug = data.companyName.toLowerCase().replace(/\s+/g, '-');
        
        const company = await prisma.company.create({
          data: {
            name: data.companyName,
            slug: `${slug}-${Date.now()}`, // Make slug unique
            description: `Company created for ${data.firstName} ${data.lastName}`,
          },
        });

        companyId = company.id;
      } else {
        // Validate company exists
        const company = await prisma.company.findUnique({
          where: { id: companyId },
        });

        if (!company) {
          throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
        }
      }
    } else {
      companyId = null;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await PasswordManager.hashPassword(data.password);

    // Create user (first user in company is automatically OWNER)
    let role: string = UserRole.USER;
    if (accountType === UserType.COMPANY_USER) {
      const userCount = await prisma.user.count({
        where: { companyId: companyId || undefined },
      });
      role = userCount === 0 ? UserRole.OWNER : UserRole.EMPLOYEE;
    }

    // Member numbers are permanent and sequential across all accounts,
    // starting at 1 in the order accounts are created — assigned inside the
    // same transaction as the insert so two concurrent signups can't land
    // on the same number.
    const user = await prisma.$transaction(async (tx) => {
      const { _max } = await tx.user.aggregate({ _max: { memberNumber: true } });
      const memberNumber = (_max.memberNumber || 0) + 1;

      return tx.user.create({
        data: {
          memberNumber,
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          companyId: companyId || undefined,
          role,
          userType: accountType,
          profile: accountType === UserType.USER ? {
            create: {
              displayName: `${data.firstName} ${data.lastName}`,
            },
          } : undefined,
        },
        include: { company: true },
      });
    });

    // Generate token
    const token = TokenManager.generateToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      userType: user.userType,
    });

    return {
      token,
      user: {
        id: user.id,
        memberNumber: user.memberNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        userType: user.userType,
      },
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        description: user.company.description,
        createdAt: user.company.createdAt,
      } : null,
    };
  }

  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: { company: true },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await PasswordManager.verifyPassword(
      credentials.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = TokenManager.generateToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      userType: user.userType,
    });

    return {
      token,
      user: {
        id: user.id,
        memberNumber: user.memberNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        userType: user.userType,
      },
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        description: user.company.description,
        createdAt: user.company.createdAt,
      } : null,
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        memberNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        userType: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: {
            phone: true,
            bio: true,
            website: true,
            displayName: true,
            avatarUrl: true,
            address: true,
            streetAddress: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Verify token validity
   */
  static async verifyTokenValidity(token: string): Promise<boolean> {
    try {
      TokenManager.verifyToken(token);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Verify old password
    const isPasswordValid = await PasswordManager.verifyPassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await PasswordManager.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      bio?: string;
      website?: string;
      streetAddress?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    }
  ): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // If email is being updated, check if it's already in use
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error('Email is already in use');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      },
    });

    // Update or create user profile if any profile fields were provided
    const profileFields = {
      phone: data.phone,
      bio: data.bio,
      website: data.website,
      streetAddress: data.streetAddress,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
    };
    if (Object.values(profileFields).some((v) => v !== undefined)) {
      await prisma.userProfile.upsert({
        where: { userId },
        create: { userId, ...profileFields },
        update: profileFields,
      });
    }

    // Return updated user with profile
    const userWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        userType: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: {
            phone: true,
            bio: true,
            website: true,
            address: true,
            streetAddress: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        },
      },
    });

    return userWithProfile;
  }
}
