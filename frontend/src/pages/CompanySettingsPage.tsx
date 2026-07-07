import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { ValidationUtils } from '@/utils/storage';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { erpNavigation } from '@/constants/navigation';

export const CompanySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || !company) {
      navigate('/login');
      return;
    }

    if (company) {
      setCompanyName(company.name);
      setSlug(company.slug);
      setWebsite(company.website || '');
      setDescription(company.description || '');
    }
  }, [company, user, navigate]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (!ValidationUtils.isValidSlug(slug)) {
      setError('Company slug is invalid (use lowercase letters, numbers, and hyphens)');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.updateCompanySettings(company!.id, {
        name: companyName,
        slug,
        website,
        description,
      });
      setSuccess('Company settings updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update company settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer
      title="Company Settings"
      subtitle="Manage your company information and preferences."
      sidebarItems={erpNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '700px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}
        {success && <div style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-3)' }}>{success}</div>}

        {/* Settings Form */}
        <Card style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Update Company Information</h3>

          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                className="input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Company Slug</label>
              <input
                type="text"
                className="input"
                value={slug}
                onChange={handleSlugChange}
                disabled={isLoading}
              />
              <span className="helper-text">
                URL-friendly identifier (lowercase letters, numbers, hyphens)
              </span>
            </div>

            <div className="form-group">
              <label>Website (Optional)</label>
              <input
                type="url"
                className="input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Settings'}
            </Button>
          </form>
        </Card>

        {/* Company Info Card */}
        <Card>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Company Information</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontWeight: 600 }}>Company ID:</span>
            <span>{company?.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontWeight: 600 }}>Created:</span>
            <span>{company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>Status:</span>
            <span>{company?.isActive ? '✅ Active' : '❌ Inactive'}</span>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
