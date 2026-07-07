import { PrismaClient } from '@prisma/client';
import { GeneratorUtils } from '../utils/generators';
import { ERROR_MESSAGES, MODULE_CONSTANTS } from '../constants';

const prisma = new PrismaClient();

/**
 * Module Service
 * Manages dynamic ERP modules for each company
 * Each company can enable/disable, rename, and reorder modules
 * All module configuration is stored in database for persistence
 */

export interface CreateModuleData {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
}

export interface UpdateModuleData {
  name?: string;
  description?: string;
  icon?: string;
  isEnabled?: boolean;
}

export interface ModuleResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isEnabled: boolean;
  displayOrder: number;
  icon?: string;
  config: any;
}

export class ModuleService {
  /**
   * Initialize default modules for a new company
   * Creates standard ERP modules that can be customized
   */
  static async initializeDefaultModules(companyId: string): Promise<void> {
    try {
      // Check if company already has modules
      const moduleCount = await prisma.module.count({
        where: { companyId },
      });

      if (moduleCount > 0) {
        return; // Already initialized
      }

      // Create default modules
      await prisma.module.createMany({
        data: MODULE_CONSTANTS.DEFAULT_MODULES.map((module, index) => ({
          companyId,
          name: module.name,
          slug: module.slug,
          displayOrder: index,
          isEnabled: true,
          config: JSON.stringify({}),
        })),
      });

      // Update company settings with module order
      const modules = await prisma.module.findMany({
        where: { companyId },
        orderBy: { displayOrder: 'asc' },
      });

      const moduleOrder = modules.map((m) => m.id);

      await prisma.companySettings.update({
        where: { companyId },
        data: { moduleOrder: JSON.stringify(moduleOrder) },
      });
    } catch (error) {
      console.error('Error initializing default modules:', error);
      throw error;
    }
  }

  /**
   * Create custom module for company
   */
  static async createModule(
    companyId: string,
    data: CreateModuleData
  ): Promise<ModuleResponse> {
    // Generate slug if not provided
    const slug = data.slug || GeneratorUtils.generateSlug(data.name);

    // Check if slug already exists in this company
    const existingModule = await prisma.module.findUnique({
      where: { companyId_slug: { companyId, slug } },
    });

    if (existingModule) {
      throw new Error(ERROR_MESSAGES.MODULE_ALREADY_EXISTS);
    }

    // Get next display order
    const lastModule = await prisma.module.findFirst({
      where: { companyId },
      orderBy: { displayOrder: 'desc' },
    });

    const nextOrder = (lastModule?.displayOrder || -1) + 1;

    // Create module
    const module = await prisma.module.create({
      data: {
        companyId,
        name: data.name,
        slug,
        description: data.description,
        icon: data.icon,
        displayOrder: nextOrder,
        isEnabled: true,
      },
    });

    // Update module order in settings
    await this.updateModuleOrderInSettings(companyId);

    return this.mapModuleResponse(module);
  }

  /**
   * Get all modules for company
   */
  static async getCompanyModules(companyId: string): Promise<ModuleResponse[]> {
    const modules = await prisma.module.findMany({
      where: { companyId },
      orderBy: { displayOrder: 'asc' },
    });

    return modules.map(this.mapModuleResponse);
  }

  /**
   * Get enabled modules only (for UI rendering)
   */
  static async getEnabledModules(companyId: string): Promise<ModuleResponse[]> {
    const modules = await prisma.module.findMany({
      where: { companyId, isEnabled: true },
      orderBy: { displayOrder: 'asc' },
    });

    return modules.map(this.mapModuleResponse);
  }

  /**
   * Get module by ID
   */
  static async getModuleById(moduleId: string, companyId: string): Promise<ModuleResponse> {
    const module = await prisma.module.findFirst({
      where: { id: moduleId, companyId },
    });

    if (!module) {
      throw new Error(ERROR_MESSAGES.MODULE_NOT_FOUND);
    }

    return this.mapModuleResponse(module);
  }

  /**
   * Update module
   */
  static async updateModule(
    moduleId: string,
    companyId: string,
    data: UpdateModuleData
  ): Promise<ModuleResponse> {
    const module = await prisma.module.findFirst({
      where: { id: moduleId, companyId },
    });

    if (!module) {
      throw new Error(ERROR_MESSAGES.MODULE_NOT_FOUND);
    }

    const updated = await prisma.module.update({
      where: { id: moduleId },
      data: {
        name: data.name || module.name,
        description: data.description !== undefined ? data.description : module.description,
        icon: data.icon !== undefined ? data.icon : module.icon,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : module.isEnabled,
      },
    });

    return this.mapModuleResponse(updated);
  }

  /**
   * Toggle module visibility
   */
  static async toggleModuleVisibility(
    moduleId: string,
    companyId: string
  ): Promise<ModuleResponse> {
    const module = await prisma.module.findFirst({
      where: { id: moduleId, companyId },
    });

    if (!module) {
      throw new Error(ERROR_MESSAGES.MODULE_NOT_FOUND);
    }

    const updated = await prisma.module.update({
      where: { id: moduleId },
      data: { isEnabled: !module.isEnabled },
    });

    return this.mapModuleResponse(updated);
  }

  /**
   * Reorder modules
   * Takes array of module IDs in desired order
   */
  static async reorderModules(companyId: string, moduleIds: string[]): Promise<void> {
    // Verify all modules belong to company
    const modules = await prisma.module.findMany({
      where: {
        companyId,
        id: { in: moduleIds },
      },
    });

    if (modules.length !== moduleIds.length) {
      throw new Error('One or more modules not found in company');
    }

    // Update display order
    const updatePromises = moduleIds.map((id, index) =>
      prisma.module.update({
        where: { id },
        data: { displayOrder: index },
      })
    );

    await Promise.all(updatePromises);

    // Update settings
    await this.updateModuleOrderInSettings(companyId);
  }

  /**
   * Delete module
   */
  static async deleteModule(moduleId: string, companyId: string): Promise<void> {
    const module = await prisma.module.findFirst({
      where: { id: moduleId, companyId },
    });

    if (!module) {
      throw new Error(ERROR_MESSAGES.MODULE_NOT_FOUND);
    }

    await prisma.module.delete({
      where: { id: moduleId },
    });

    // Update module order in settings
    await this.updateModuleOrderInSettings(companyId);
  }

  /**
   * Update module order in company settings
   * Internal method to sync settings
   */
  private static async updateModuleOrderInSettings(companyId: string): Promise<void> {
    const modules = await prisma.module.findMany({
      where: { companyId },
      orderBy: { displayOrder: 'asc' },
    });

    const moduleOrder = modules.map((m) => m.id);

    await prisma.companySettings.update({
      where: { companyId },
      data: { moduleOrder: JSON.stringify(moduleOrder) },
    });
  }

  /**
   * Map database module to response format
   */
  private static mapModuleResponse(module: any): ModuleResponse {
    return {
      id: module.id,
      name: module.name,
      slug: module.slug,
      description: module.description,
      isEnabled: module.isEnabled,
      displayOrder: module.displayOrder,
      icon: module.icon,
      config: module.config,
    };
  }
}
