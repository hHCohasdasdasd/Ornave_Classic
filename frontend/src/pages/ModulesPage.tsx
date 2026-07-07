import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { Module } from '@/types';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { erpNavigation } from '@/constants/navigation';

export const ModulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !company) {
      navigate('/login');
      return;
    }

    loadModules();
  }, [company, user, navigate]);

  const loadModules = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getCompanyModules(company!.id);
      setModules(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleName.trim()) {
      setError('Module name is required');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.createModule(company!.id, moduleName, description, '');
      setModuleName('');
      setDescription('');
      await loadModules();
    } catch (err: any) {
      setError(err.message || 'Failed to create module');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      await apiClient.deleteModule(company!.id, moduleId);
      await loadModules();
    } catch (err: any) {
      setError(err.message || 'Failed to delete module');
    }
  };

  return (
    <PageContainer
      title="Modules"
      subtitle="Create and manage your business modules."
      sidebarItems={erpNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '900px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}

        {/* Create Module Form */}
        <Card style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Create New Module</h3>

          <form onSubmit={handleCreateModule} className="form">
            <div className="form-group">
              <label>Module Name</label>
              <input
                type="text"
                className="input"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Module'}
            </Button>
          </form>
        </Card>

        {/* Modules List */}
        <h3 style={{ marginBottom: 'var(--space-3)' }}>Your Modules</h3>
        {modules.length === 0 ? (
          <p className="muted-text">No modules yet. Create one above to get started.</p>
        ) : (
          <div className="grid">
            {modules.map((module) => (
              <Card key={module.id} hoverable>
                <div className="card__title">{module.name}</div>
                <div className="card__description">{module.description}</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-2)' }}>
                  <Button onClick={() => navigate(`/modules/${module.id}`)}>Edit</Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDeleteModule(module.id)}
                    style={{ color: 'var(--color-danger)' }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
