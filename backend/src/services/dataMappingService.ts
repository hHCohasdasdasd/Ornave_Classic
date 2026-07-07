/**
 * PHASE 4: DATA MAPPING LAYER (INTEROPERABILITY)
 * 
 * Maps internal modules to global standard objects.
 * Allows each company to customize internally while maintaining B2B standardization.
 * 
 * Problem Solved:
 * - Company A calls their sales module "Orders"
 * - Company B calls theirs "Sales Pipeline"
 * - Both need to exchange POs and invoices
 * - This layer translates between internal & global representations
 * 
 * Architectural Notes:
 * - Bidirectional mapping (internal ↔ global)
 * - Field-level mapping support
 * - Version control for mapping schemas
 * - Extensible for custom objects
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Global standard objects (shared across all companies)
 */
export enum GlobalStandardObject {
  PURCHASE_ORDER = 'GlobalPurchaseOrder',
  INVOICE = 'GlobalInvoice',
  SHIPMENT = 'GlobalShipment',
  INVENTORY_ITEM = 'GlobalInventoryItem',
  PAYMENT = 'GlobalPayment',
  CONTRACT = 'GlobalContract',
}

export interface FieldMapping {
  [internalField: string]: string; // Maps: internalFieldName -> globalFieldName
}

export interface ModuleMappingConfig {
  moduleName: string; // e.g., "sales", "inventory", "purchasing"
  globalObjects: GlobalStandardObject[]; // What global objects this module maps to
  fieldMappings: FieldMapping; // Field-level mapping
  version: number;
  isActive: boolean;
}

export class DataMappingService {
  /**
   * Define how a company's module maps to global objects
   */
  static async defineModuleMapping(
    companyId: string,
    config: ModuleMappingConfig
  ) {
    // Validate company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Check if module exists (optional - could be a module slug that will be created)
    const module = await prisma.module.findUnique({
      where: {
        companyId_slug: {
          companyId,
          slug: config.moduleName,
        },
      },
    });

    // Module check is just a warning - mapping can be defined before module creation
    if (!module) {
      console.log(`Warning: Module '${config.moduleName}' not found for company ${companyId}`);
    }

    // Create or update mapping
    const mapping = await prisma.moduleMapping.upsert({
      where: {
        companyId_moduleName: {
          companyId,
          moduleName: config.moduleName,
        },
      },
      create: {
        companyId,
        moduleName: config.moduleName,
        globalObjects: JSON.stringify(config.globalObjects),
        fieldMapping: JSON.stringify(config.fieldMappings),
      },
      update: {
        globalObjects: JSON.stringify(config.globalObjects),
        fieldMapping: JSON.stringify(config.fieldMappings),
      },
    });

    return mapping;
  }

  /**
   * Get mapping configuration for a module
   */
  static async getModuleMapping(companyId: string, moduleName: string) {
    const mapping = await prisma.moduleMapping.findUnique({
      where: {
        companyId_moduleName: {
          companyId,
          moduleName,
        },
      },
    });

    if (!mapping) {
      return null;
    }

    return {
      moduleName: mapping.moduleName,
      globalObjects: JSON.parse(mapping.globalObjects),
      fieldMappings: JSON.parse(mapping.fieldMapping),
    };
  }

  /**
   * Transform internal data to global standard format
   */
  static async transformToGlobal(
    companyId: string,
    moduleName: string,
    internalData: Record<string, any>
  ): Promise<Record<string, any>> {
    const mapping = await this.getModuleMapping(companyId, moduleName);

    if (!mapping) {
      // No mapping defined, return as-is (or throw depending on policy)
      console.warn(`No mapping for ${companyId}/${moduleName}`);
      return internalData;
    }

    const globalData: Record<string, any> = {};
    const fieldMappings = mapping.fieldMappings;

    // Apply field mappings
    for (const [internalField, globalField] of Object.entries(fieldMappings)) {
      if (internalField in internalData) {
        globalData[globalField as string] = internalData[internalField];
      }
    }

    // Copy any unmapped standard fields
    for (const [key, value] of Object.entries(internalData)) {
      if (!globalData[key] && this.isStandardField(key)) {
        globalData[key] = value;
      }
    }

    return globalData;
  }

  /**
   * Transform global data to company's internal format
   */
  static async transformToInternal(
    companyId: string,
    moduleName: string,
    globalData: Record<string, any>
  ): Promise<Record<string, any>> {
    const mapping = await this.getModuleMapping(companyId, moduleName);

    if (!mapping) {
      console.warn(`No mapping for ${companyId}/${moduleName}`);
      return globalData;
    }

    const internalData: Record<string, any> = {};
    const fieldMappings = mapping.fieldMappings;

    // Reverse mapping: global -> internal
    const reverseMapping: Record<string, string> = {};
    for (const [internal, global] of Object.entries(fieldMappings)) {
      reverseMapping[(global as string)] = internal;
    }

    // Apply reverse mappings
    for (const [globalField, value] of Object.entries(globalData)) {
      const internalField = reverseMapping[globalField] || globalField;
      internalData[internalField] = value;
    }

    return internalData;
  }

  /**
   * Get all mappings for a company
   */
  static async getCompanyMappings(companyId: string) {
    const mappings = await prisma.moduleMapping.findMany({
      where: { companyId },
    });

    return mappings.map((m) => ({
      moduleName: m.moduleName,
      globalObjects: JSON.parse(m.globalObjects),
      fieldMappings: JSON.parse(m.fieldMapping),
    }));
  }

  /**
   * Validate if a module mapping is correctly defined
   */
  static async validateMapping(companyId: string, moduleName: string): Promise<boolean> {
    const mapping = await this.getModuleMapping(companyId, moduleName);
    if (!mapping) return false;

    // Check if module exists
    const module = await prisma.module.findUnique({
      where: {
        companyId_slug: {
          companyId,
          slug: moduleName,
        },
      },
    });

    return !!module;
  }

  /**
   * Get suggested mapping based on module name
   * (Can be enhanced with AI/ML later)
   */
  static getSuggestedMapping(moduleName: string): ModuleMappingConfig | null {
    // Common module → global object mappings
    const suggestions: Record<string, ModuleMappingConfig> = {
      sales: {
        moduleName: 'sales',
        globalObjects: [
          GlobalStandardObject.INVOICE,
          GlobalStandardObject.PAYMENT,
        ],
        fieldMappings: {
          orderId: 'invoiceNumber',
          customerId: 'buyerCompanyId',
          amount: 'totalAmount',
          createdDate: 'issuedDate',
        },
        version: 1,
        isActive: true,
      },
      purchasing: {
        moduleName: 'purchasing',
        globalObjects: [
          GlobalStandardObject.PURCHASE_ORDER,
          GlobalStandardObject.SHIPMENT,
        ],
        fieldMappings: {
          poId: 'purchaseOrderNumber',
          vendorId: 'supplierCompanyId',
          totalCost: 'totalAmount',
          requestDate: 'requestDate',
        },
        version: 1,
        isActive: true,
      },
      inventory: {
        moduleName: 'inventory',
        globalObjects: [GlobalStandardObject.INVENTORY_ITEM],
        fieldMappings: {
          itemCode: 'sku',
          itemName: 'description',
          currentStock: 'quantity',
          unitCost: 'unitPrice',
        },
        version: 1,
        isActive: true,
      },
    };

    return suggestions[moduleName] || null;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Check if a field is part of the global standard
   */
  private static isStandardField(field: string): boolean {
    const standardFields = [
      'id',
      'createdAt',
      'updatedAt',
      'status',
      'reference',
      'notes',
      'amount',
      'quantity',
    ];
    return standardFields.includes(field);
  }
}
