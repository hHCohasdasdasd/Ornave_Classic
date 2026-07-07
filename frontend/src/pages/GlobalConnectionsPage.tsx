import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { globalNavigation } from '@/constants/navigation';

export const GlobalConnectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadConnections = async () => {
      try {
        const response = await apiClient.getGlobalConnections();
        setConnections(response.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load connections');
      }
    };

    loadConnections();
  }, [user]);

  const handleRequest = async () => {
    try {
      await apiClient.requestGlobalConnection(companyId);
      const response = await apiClient.getGlobalConnections();
      setConnections(response.data || []);
      setCompanyId('');
    } catch (err: any) {
      setError(err.message || 'Failed to request connection');
    }
  };

  return (
    <PageContainer
      title="Connections"
      subtitle="Manage your connections to companies."
      sidebarItems={globalNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '700px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}

        <Card style={{ marginBottom: 'var(--space-3)' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Connect to a Company</h3>
          <div className="form">
            <input
              className="input"
              placeholder="Company ID"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
            <Button onClick={handleRequest}>Request Connection</Button>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Your Connections</h3>
          {connections.length === 0 ? (
            <p className="muted-text">No connections yet.</p>
          ) : (
            <ul style={{ listStyle: 'none' }}>
              {connections.map((conn) => (
                <li key={conn.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
                  <strong>{conn.company?.name || conn.companyId}</strong> — {conn.status}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
