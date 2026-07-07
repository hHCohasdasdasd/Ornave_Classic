import { PrismaClient } from '@prisma/client';
import { GeneratorUtils } from '../utils/generators';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

/**
 * Page Service
 * Manages dynamic pages for each company
 * Stores page layout and configuration in JSON format
 * Supports drag-and-drop building and dynamic component rendering
 */

export interface CreatePageData {
  title: string;
  slug?: string;
  description?: string;
  icon?: string;
  layout?: any; // JSON structure for page builder
}

export interface UpdatePageData {
  title?: string;
  description?: string;
  icon?: string;
  layout?: any;
  isPublished?: boolean;
}

export interface PageResponse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  icon?: string;
  isPublished: boolean;
  displayOrder: number;
  layout: any;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export class PageService {
  /**
   * Create new page for company
   * Default layout can be customized with component tree
   */
  static async createPage(
    companyId: string,
    data: CreatePageData
  ): Promise<PageResponse> {
    // Generate slug if not provided
    const slug = data.slug || GeneratorUtils.generateSlug(data.title);

    // Check if slug already exists in this company
    const existingPage = await prisma.page.findUnique({
      where: { companyId_slug: { companyId, slug } },
    });

    if (existingPage) {
      throw new Error(ERROR_MESSAGES.PAGE_SLUG_TAKEN);
    }

    // Get next display order
    const lastPage = await prisma.page.findFirst({
      where: { companyId },
      orderBy: { displayOrder: 'desc' },
    });

    const nextOrder = (lastPage?.displayOrder || -1) + 1;

    // Default layout structure
    const defaultLayout = data.layout || {
      type: 'container',
      components: [],
    };

    // Create page
    const page = await prisma.page.create({
      data: {
        companyId,
        title: data.title,
        slug,
        description: data.description,
        icon: data.icon,
        displayOrder: nextOrder,
        layout: defaultLayout,
        metadata: JSON.stringify({
          author: 'system',
          version: '1.0',
        }),
      },
    });

    // Update page order in settings
    await this.updatePageOrderInSettings(companyId);

    return this.mapPageResponse(page);
  }

  /**
   * Get all pages for company
   */
  static async getCompanyPages(companyId: string): Promise<PageResponse[]> {
    const pages = await prisma.page.findMany({
      where: { companyId },
      orderBy: { displayOrder: 'asc' },
    });

    return pages.map(this.mapPageResponse);
  }

  /**
   * Get published pages only (for public viewing)
   */
  static async getPublishedPages(companyId: string): Promise<PageResponse[]> {
    const pages = await prisma.page.findMany({
      where: { companyId, isPublished: true },
      orderBy: { displayOrder: 'asc' },
    });

    return pages.map(this.mapPageResponse);
  }

  /**
   * Get page by ID
   */
  static async getPageById(pageId: string, companyId: string): Promise<PageResponse> {
    const page = await prisma.page.findFirst({
      where: { id: pageId, companyId },
    });

    if (!page) {
      throw new Error(ERROR_MESSAGES.PAGE_NOT_FOUND);
    }

    return this.mapPageResponse(page);
  }

  /**
   * Get page by slug
   */
  static async getPageBySlug(slug: string, companyId: string): Promise<PageResponse> {
    const page = await prisma.page.findUnique({
      where: { companyId_slug: { companyId, slug } },
    });

    if (!page) {
      throw new Error(ERROR_MESSAGES.PAGE_NOT_FOUND);
    }

    return this.mapPageResponse(page);
  }

  /**
   * Update page
   */
  static async updatePage(
    pageId: string,
    companyId: string,
    data: UpdatePageData
  ): Promise<PageResponse> {
    const page = await prisma.page.findFirst({
      where: { id: pageId, companyId },
    });

    if (!page) {
      throw new Error(ERROR_MESSAGES.PAGE_NOT_FOUND);
    }

    const updated = await prisma.page.update({
      where: { id: pageId },
      data: {
        title: data.title || page.title,
        description: data.description !== undefined ? data.description : page.description,
        icon: data.icon !== undefined ? data.icon : page.icon,
        layout: data.layout || page.layout,
        isPublished: data.isPublished !== undefined ? data.isPublished : page.isPublished,
      },
    });

    return this.mapPageResponse(updated);
  }

  /**
   * Publish/Unpublish page
   */
  static async togglePagePublish(
    pageId: string,
    companyId: string
  ): Promise<PageResponse> {
    const page = await prisma.page.findFirst({
      where: { id: pageId, companyId },
    });

    if (!page) {
      throw new Error(ERROR_MESSAGES.PAGE_NOT_FOUND);
    }

    const updated = await prisma.page.update({
      where: { id: pageId },
      data: { isPublished: !page.isPublished },
    });

    return this.mapPageResponse(updated);
  }

  /**
   * Update page layout (page builder operations)
   * Accepts full component tree structure
   */
  static async updatePageLayout(
    pageId: string,
    companyId: string,
    layout: any
  ): Promise<PageResponse> {
    const page = await prisma.page.findFirst({
      where: { id: pageId, companyId },
    });

    if (!page) {
      throw new Error(ERROR_MESSAGES.PAGE_NOT_FOUND);
    }

    const updated = await prisma.page.update({
      where: { id: pageId },
      data: { layout },
    });

    return this.mapPageResponse(updated);
  }

  /**
   * Reorder pages
   * Takes array of page IDs in desired order
   */
  static async reorderPages(companyId: string, pageIds: string[]): Promise<void> {
    // Verify all pages belong to company
    const pages = await prisma.page.findMany({
      where: {
        companyId,
        id: { in: pageIds },
      },
    });

    if (pages.length !== pageIds.length) {
      throw new Error('One or more pages not found in company');
    }

    // Update display order
    const updatePromises = pageIds.map((id, index) =>
      prisma.page.update({
        where: { id },
        data: { displayOrder: index },
      })
    );

    await Promise.all(updatePromises);

    // Update settings
    await this.updatePageOrderInSettings(companyId);
  }

  /**
   * Delete page
   */
  static async deletePage(pageId: string, companyId: string): Promise<void> {
    const page = await prisma.page.findFirst({
      where: { id: pageId, companyId },
    });

    if (!page) {
      throw new Error(ERROR_MESSAGES.PAGE_NOT_FOUND);
    }

    await prisma.page.delete({
      where: { id: pageId },
    });

    // Update page order in settings
    await this.updatePageOrderInSettings(companyId);
  }

  /**
   * Update page order in company settings
   * Internal method to sync settings
   */
  private static async updatePageOrderInSettings(companyId: string): Promise<void> {
    const pages = await prisma.page.findMany({
      where: { companyId },
      orderBy: { displayOrder: 'asc' },
    });

    const pageOrder = pages.map((p) => p.id);

    await prisma.companySettings.update({
      where: { companyId },
      data: { pageOrder: JSON.stringify(pageOrder) },
    });
  }

  /**
   * Map database page to response format
   */
  private static mapPageResponse(page: any): PageResponse {
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      description: page.description,
      icon: page.icon,
      isPublished: page.isPublished,
      displayOrder: page.displayOrder,
      layout: page.layout,
      metadata: page.metadata,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }
}
