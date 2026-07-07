import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { erpNavigation } from '@/constants/navigation';

export const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !company) {
      navigate('/login');
      return;
    }
  }, [company, user, navigate]);

  return (
    <PageContainer
      title="Messages"
      subtitle="Communicate with connected companies."
      sidebarItems={erpNavigation}
    >
      <div className="fade-in">
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}
        <p className="muted-text">Message functionality is coming soon. This will allow you to communicate with connected companies.</p>
      </div>
    </PageContainer>
  );
};
