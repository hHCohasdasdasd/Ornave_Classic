// Token storage keys
const TOKEN_KEY = 'ornave_token';
const USER_KEY = 'ornave_user';
const COMPANY_KEY = 'ornave_company';

export const TokenStorage = {
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  setUser: (user: any) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getUser: () => {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user && user !== 'undefined' ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },
  removeUser: () => {
    localStorage.removeItem(USER_KEY);
  },

  setCompany: (company: any) => {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
  },
  getCompany: () => {
    try {
      const company = localStorage.getItem(COMPANY_KEY);
      return company && company !== 'undefined' ? JSON.parse(company) : null;
    } catch (e) {
      return null;
    }
  },
  removeCompany: () => {
    localStorage.removeItem(COMPANY_KEY);
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(COMPANY_KEY);
  },
};

// Validation utilities
export const ValidationUtils = {
  isValidEmail: (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isValidPassword: (password: string) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  },

  isValidCompanyName: (name: string) => {
    return name.length >= 2 && name.length <= 100;
  },

  isValidSlug: (slug: string) => {
    const re = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return re.test(slug);
  },

  sanitizeInput: (input: string) => {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 255);
  },
};

// Error messages
export const ErrorMessages = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Your session has expired. Please login again.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
  INVALID_COMPANY_NAME: 'Company name must be between 2 and 100 characters.',
  INVALID_SLUG: 'Slug can only contain lowercase letters, numbers, and hyphens.',
};

// Success messages
export const SuccessMessages = {
  REGISTERED: 'Account created successfully!',
  LOGGED_IN: 'Logged in successfully!',
  COMPANY_CREATED: 'Company created successfully!',
  MODULE_CREATED: 'Module created successfully!',
  PAGE_CREATED: 'Page created successfully!',
  CONNECTION_SENT: 'Connection request sent!',
  CONNECTION_ACCEPTED: 'Connection accepted!',
  TRANSACTION_CREATED: 'Transaction created successfully!',
  MESSAGE_SENT: 'Message sent!',
};
