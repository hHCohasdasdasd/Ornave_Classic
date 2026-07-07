import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { ProtectedPageOverlay } from '@/components/ui/ProtectedPageOverlay';
import { globalNavigation } from '@/constants/navigation';

export const GlobalDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      try {
        const response = await apiClient.getGlobalDashboard();
        setData(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      }
    };

    loadDashboard();
  }, [user]);

  return (
    <>
      <ProtectedPageOverlay isVisible={!user} />
      <PageContainer
        title={`Welcome, ${user?.firstName}`}
        subtitle="Your personal dashboard across all company connections."
        sidebarItems={globalNavigation}
      >
      <div className="fade-in">
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}

        <div className="grid" style={{ marginBottom: 'var(--space-4)' }}>
          <Card>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Connected Companies
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{data?.connections?.length || 0}</div>
          </Card>
          <Card>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Open Requests
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{data?.openRequests?.length || 0}</div>
          </Card>
          <Card>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Pending Actions
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{data?.pendingActions?.length || 0}</div>
          </Card>
        </div>

        <Card>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Recent Activity</h3>
          {(data?.recentActivity || []).length === 0 ? (
            <p className="muted-text">No recent activity yet.</p>
          ) : (
            (data?.recentActivity || []).map((item: any) => (
              <div key={item.requestId} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
                <strong>{item.title}</strong>
                <div className="muted-text">{item.description}</div>
              </div>
            ))
          )}
        </Card>
      </div>
    </PageContainer>
    </>
  );
};
