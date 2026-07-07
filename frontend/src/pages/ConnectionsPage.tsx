import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { Connection } from '@/types';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { erpNavigation } from '@/constants/navigation';

export const ConnectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [incomingConnections, setIncomingConnections] = useState<Connection[]>([]);
  const [activeConnections, setActiveConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !company) {
      navigate('/login');
      return;
    }

    loadConnections();
  }, [company, user, navigate]);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const [incoming, active] = await Promise.all([
        apiClient.getIncomingConnections(company!.id),
        apiClient.getActiveConnections(company!.id),
      ]);
      setIncomingConnections(incoming.data || []);
      setActiveConnections(active.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      await apiClient.acceptConnection(company!.id, connectionId);
      await loadConnections();
    } catch (err: any) {
      setError(err.message || 'Failed to accept connection');
    }
  };

  return (
    <PageContainer
      title="Connections"
      subtitle="Manage your company connections."
      sidebarItems={erpNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '900px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}

        {/* Incoming Requests */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Incoming Connection Requests ({incomingConnections.length})</h3>
          {incomingConnections.length === 0 ? (
            <p className="muted-text">No incoming connection requests</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>From Company</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomingConnections.map((conn) => (
                  <tr key={conn.id}>
                    <td>{conn.fromCompanyId}</td>
                    <td>{new Date(conn.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button onClick={() => handleAcceptConnection(conn.id)}>Accept</Button>
                        <Button variant="secondary" style={{ color: 'var(--color-danger)' }}>Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Active Connections */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Active Connections ({activeConnections.length})</h3>
          {activeConnections.length === 0 ? (
            <p className="muted-text">No active connections yet</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Connected Since</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeConnections.map((conn) => (
                  <tr key={conn.id}>
                    <td>{conn.fromCompanyId}</td>
                    <td>{new Date(conn.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="status-badge status-badge--success">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
