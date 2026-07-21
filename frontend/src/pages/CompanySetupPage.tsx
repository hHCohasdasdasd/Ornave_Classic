import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ValidationUtils, ErrorMessages, TokenStorage } from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { firmService } from '@/services/firmService';
import { BUSINESS_TYPE_OPTIONS } from '@/utils/businessType';

export const CompanySetupPage: React.FC = () => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [industry, setIndustry] = useState('Professional Services');

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!companyName || companyName.trim().length < 3) {
      errors.companyName = 'Company name is required (at least 3 characters)';
    }

    if (!slug || !ValidationUtils.isValidSlug(slug)) {
      errors.slug = ErrorMessages.INVALID_SLUG;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Create unique ID if slug is missing or invalid
      const firmId = slug || companyName.toLowerCase().replace(/\s+/g, '-');
      
      // Register firm globally for discovery
      const firmData = {
        id: firmId,
        slug: firmId,
        name: companyName,
        description: `Welcome to ${companyName}. We provide top-tier solutions in ${industry}.`,
        industry,
        location: 'Global',
        connectionCount: 0,
        type: 'firm'
      };

      await firmService.registerFirmGlobally(firmData);

      // Force context update or simple storage sync
      TokenStorage.setCompany({
        id: firmId,
        name: companyName,
        slug: firmId,
        description: firmData.description,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      localStorage.setItem('ornave_last_created_firm', JSON.stringify({ id: firmId, name: companyName }));
      window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'firm_registered', id: firmId } }));

      // Navigate to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (error) {
      console.error('Failed to create company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <h1 className="auth-card__title">Create Your Company</h1>
        <p className="muted-text" style={{ marginBottom: '32px' }}>
          Welcome {user?.firstName}! Let's set up your company profile.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              className="input"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (fieldErrors.companyName) {
                  setFieldErrors({ ...fieldErrors, companyName: '' });
                }
              }}
              placeholder="e.g. Acme Corp"
              disabled={isLoading}
              style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
            />
            {fieldErrors.companyName && <div style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{fieldErrors.companyName}</div>}
          </div>

          <div className="form-group">
            <label>Business Type</label>
            <select
              className="input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
            >
              {BUSINESS_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.value}</option>
              ))}
            </select>
            <span className="helper-text" style={{ marginTop: '4px', display: 'block' }}>
              Your profile layout is tailored to your business type — e.g. Restaurants get a Menu, Real Estate firms get Listings.
            </span>
          </div>

          <div className="form-group">
            <label>Company Slug</label>
            <input
              type="text"
              className="input"
              value={slug}
              onChange={handleSlugChange}
              placeholder="my-company"
              disabled={isLoading}
              style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
            />
            {fieldErrors.slug && <div style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{fieldErrors.slug}</div>}
            <span className="helper-text" style={{ marginTop: '4px', display: 'block' }}>
              Use only lowercase letters, numbers, and hyphens for your unique URL
            </span>
          </div>

          <Button type="submit" disabled={isLoading} className="btn--primary">
            {isLoading ? 'Creating company...' : 'Create Company'}
          </Button>
        </form>
      </div>
    </div>
  );
};
