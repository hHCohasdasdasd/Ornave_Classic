import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Company } from '@/types';
import { TokenStorage } from '@/utils/storage';
import { apiClient } from '@/services/api';
import { firmService } from '@/services/firmService';

const AUTH_BYPASS_ENABLED = false;
const DEMO_LOGGED_OUT_KEY = 'ornave_demo_logged_out';

const BYPASS_USER: User = {
  id: 'demo-user',
  email: 'demo@ornave.local',
  firstName: 'Demo',
  lastName: 'User',
  role: 'OWNER',
  userType: 'COMPANY_USER',
  companyId: 'demo-company',
  createdAt: new Date().toISOString(),
};

const BYPASS_COMPANY: Company = {
  id: 'demo-company',
  name: 'Ornave Demo Company',
  slug: 'ornave-demo-company',
  token: 'demo-company-token',
  description: 'Frontend auth bypass demo workspace',
  website: 'https://ornave.local',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const BYPASS_TOKEN = 'ornave-demo-token';

const GUEST_USER: User = {
  id: 'guest',
  email: 'guest@ornave.com',
  firstName: 'Welcome',
  lastName: 'Guest',
  role: 'USER',
  userType: 'USER',
  createdAt: new Date().toISOString(),
  headline: 'Explore Ornave',
  bio: 'Discover the power of unified enterprise infrastructure',
  website: 'https://ornave.com',
};

function isDemoLoggedOut() {
  return localStorage.getItem(DEMO_LOGGED_OUT_KEY) === '1';
}

function setDemoLoggedOut(loggedOut: boolean) {
  if (loggedOut) {
    localStorage.setItem(DEMO_LOGGED_OUT_KEY, '1');
  } else {
    localStorage.removeItem(DEMO_LOGGED_OUT_KEY);
  }
}

function persistBypassSession() {
  TokenStorage.setToken(BYPASS_TOKEN);
  TokenStorage.setUser(BYPASS_USER);
  TokenStorage.setCompany(BYPASS_COMPANY);
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, businessType?: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    companyName?: string,
    userType?: 'USER' | 'COMPANY_USER',
    businessType?: string
  ) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
  triggerAuthModal: (message: string) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMessage: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (AUTH_BYPASS_ENABLED && isDemoLoggedOut()) {
      return null;
    }
    const storedUser = TokenStorage.getUser();
    if (storedUser?.id === 'guest') return null; // Treat guest as logged out for global modal
    return storedUser || (AUTH_BYPASS_ENABLED ? BYPASS_USER : null);
  });
  const [company, setCompany] = useState<Company | null>(() => {
    if (AUTH_BYPASS_ENABLED && isDemoLoggedOut()) {
      return null;
    }
    return TokenStorage.getCompany() || (AUTH_BYPASS_ENABLED ? BYPASS_COMPANY : null);
  });
  const [token, setToken] = useState<string | null>(() => {
    if (AUTH_BYPASS_ENABLED && isDemoLoggedOut()) {
      return null;
    }
    return TokenStorage.getToken() || (AUTH_BYPASS_ENABLED ? BYPASS_TOKEN : null);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');

  // Verify token on mount
  useEffect(() => {
    if (user?.userType === 'COMPANY_USER' && company) {
      firmService.registerFirmGlobally({
        id: company.id,
        slug: company.slug,
        name: company.name,
        description: company.description || `Welcome to ${company.name}.`,
        industry: 'Professional Services',
        location: 'Global',
        connectionCount: 0
      });
    }

    if (AUTH_BYPASS_ENABLED) {
      if (isDemoLoggedOut()) {
        TokenStorage.clear();
        setUser(null); // Changed from GUEST_USER to null to trigger login prompts
        setCompany(null);
        setToken(null);
        return;
      }

      persistBypassSession();
      setUser(BYPASS_USER);
      setCompany(BYPASS_COMPANY);
      setToken(BYPASS_TOKEN);
      return;
    }

    const verifyToken = async () => {
      if (token && user) {
        try {
          const response = await apiClient.getProfile();
          const fresh = response?.data;
          if (fresh) {
            // Merge in the latest server-side fields (e.g. memberNumber) so a
            // user object cached from before a field existed self-heals
            // instead of staying stale until the next manual login.
            const updatedUser: User = {
              ...user,
              id: fresh.id,
              memberNumber: fresh.memberNumber,
              email: fresh.email,
              firstName: fresh.firstName,
              lastName: fresh.lastName,
              role: fresh.role,
              companyId: fresh.companyId,
              userType: fresh.userType,
            };
            setUser(updatedUser);
            TokenStorage.setUser(updatedUser);
          }
        } catch (err) {
          // Token is invalid, clear everything
          logout();
        }
      }
    };
    verifyToken();
  }, [token]);

  const login = async (email: string, password: string, businessType?: string) => {
    if (AUTH_BYPASS_ENABLED) {
      setDemoLoggedOut(false);
      persistBypassSession();
      setToken(BYPASS_TOKEN);
      setUser(BYPASS_USER);
      setCompany(BYPASS_COMPANY);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.login(email, password);
      const { token: newToken, user: newUser, company: newCompany } = response.data;

      // Store in localStorage
      TokenStorage.setToken(newToken);
      TokenStorage.setUser(newUser);
      TokenStorage.setCompany(newCompany);

      // Register company for discovery if it's a company user
      if (newUser.userType === 'COMPANY_USER' && newCompany) {
        firmService.registerFirmGlobally({
          id: newCompany.id,
          slug: newCompany.slug,
          name: newCompany.name,
          description: newCompany.description || `Welcome to ${newCompany.name}.`,
          industry: businessType || 'Professional Services',
          location: 'Global',
          connectionCount: 0
        });
      }

      // Update state
      setToken(newToken);
      setUser(newUser);
      setCompany(newCompany);
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    companyName?: string,
    userType: 'USER' | 'COMPANY_USER' = 'COMPANY_USER',
    businessType?: string
  ) => {
    if (AUTH_BYPASS_ENABLED) {
      setDemoLoggedOut(false);
      persistBypassSession();
      setToken(BYPASS_TOKEN);
      setUser(BYPASS_USER);
      setCompany(BYPASS_COMPANY);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.register(email, password, firstName, lastName, companyName, userType);
      // After registration, auto-login
      await login(email, password, businessType);
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (AUTH_BYPASS_ENABLED) {
      setDemoLoggedOut(true);
      TokenStorage.clear();
      setUser(null);
      setCompany(null);
      setToken(null);
      setError(null);
      return;
    }

    TokenStorage.clear();
    setUser(null);
    setCompany(null);
    setToken(null);
    setError(null);
  };

  const triggerAuthModal = (message: string) => {
    setAuthModalMessage(message);
    setShowAuthModal(true);
  };

  const value: AuthContextType = {
    user,
    company,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    setError,
    triggerAuthModal,
    showAuthModal,
    setShowAuthModal,
    authModalMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
