import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { globalNavigation } from '@/constants/navigation';

export const GlobalActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadActivity = async () => {
      try {
        const response = await apiClient.getGlobalActivity();
        setActivity(response.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load activity');
      }
    };

    loadActivity();
  }, [user, navigate]);

  return (
    <PageContainer
      title="Activity Timeline"
      subtitle="View all your activity across companies."
      sidebarItems={globalNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '900px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}

        <Card>
          {activity.length === 0 ? (
            <p className="muted-text">No activity yet.</p>
          ) : (
            activity.map((item) => (
              <div key={item.requestId} style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border-dark)' }}>
                <strong>{item.title}</strong>
                <div className="muted-text" style={{ marginTop: '4px' }}>{item.description}</div>
                <small style={{ color: 'var(--color-muted)', fontSize: '12px' }}>{item.lastUpdate}</small>
              </div>
            ))
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
