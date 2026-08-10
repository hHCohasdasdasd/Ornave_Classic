// Token storage keys
const AUTHENTICATED_KEY = 'ornave_authenticated';
const USER_KEY = 'ornave_user';
const COMPANY_KEY = 'ornave_company';

/**
 * Namespaces a localStorage key by the current user's id. Several
 * "own profile" features (resume sections, membership tier — there's no
 * backend model for these yet) store their client-side-only state under a
 * flat, un-namespaced key. Without this, that state leaks across accounts
 * that share a browser: log in as a different user and you'd see the
 * previous account's data, because nothing ever distinguished whose it was.
 * Falls back to the bare key only when there's genuinely no logged-in user.
 */
export function scopedKey(baseKey: string, userId?: string | null): string {
  return userId ? `${baseKey}_${userId}` : baseKey;
}

// The real JWT lives only in an httpOnly cookie now — page JS can't read it,
// which is the point (an XSS bug can no longer steal a persistent session
// token out of localStorage). This is just a non-secret "am I logged in"
// marker so the UI can render its logged-in/out state without waiting on a
// network round trip; the cookie is what the backend actually trusts.
export const TokenStorage = {
  setAuthenticated: () => {
    localStorage.setItem(AUTHENTICATED_KEY, '1');
  },
  isAuthenticated: () => {
    return localStorage.getItem(AUTHENTICATED_KEY) === '1';
  },
  clearAuthenticated: () => {
    localStorage.removeItem(AUTHENTICATED_KEY);
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
    localStorage.removeItem(AUTHENTICATED_KEY);
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
