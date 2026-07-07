/**
 * Core constants for the Ornave platform
 * Used across authentication, validation, and business logic
 */

export const AUTH_CONSTANTS = {
  JWT_EXPIRES_IN: process.env.JWT_EXPIRY || '7d',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
};

export const COMPANY_CONSTANTS = {
  SLUG_REGEX: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
};

export const MODULE_CONSTANTS = {
  DEFAULT_MODULES: [
    { name: 'Dashboard', slug: 'dashboard', order: 0 },
    { name: 'Inventory', slug: 'inventory', order: 1 },
    { name: 'Sales', slug: 'sales', order: 2 },
    { name: 'Purchasing', slug: 'purchasing', order: 3 },
    { name: 'Accounting', slug: 'accounting', order: 4 },
    { name: 'Reports', slug: 'reports', order: 5 },
  ],
};

export const PAGE_CONSTANTS = {
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 200,
};

export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  USER_NOT_FOUND: 'User not found',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden - insufficient permissions',
  
  // Company
  COMPANY_NOT_FOUND: 'Company not found',
  COMPANY_NAME_TAKEN: 'Company name already taken',
  COMPANY_SLUG_TAKEN: 'Company slug already taken',
  
  // Module
  MODULE_NOT_FOUND: 'Module not found',
  MODULE_ALREADY_EXISTS: 'Module already exists',
  
  // Page
  PAGE_NOT_FOUND: 'Page not found',
  PAGE_SLUG_TAKEN: 'Page slug already taken',
  
  // Connection
  CONNECTION_NOT_FOUND: 'Connection not found',
  ALREADY_CONNECTED: 'Already connected to this company',
  
  // General
  INTERNAL_ERROR: 'Internal server error',
  INVALID_INPUT: 'Invalid input provided',
};

export const SUCCESS_MESSAGES = {
  AUTH_SUCCESS: 'Authentication successful',
  COMPANY_CREATED: 'Company created successfully',
  USER_CREATED: 'User created successfully',
  OPERATION_SUCCESS: 'Operation completed successfully',
};
