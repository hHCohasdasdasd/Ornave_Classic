import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/ui/PageContainer';
import { erpNavigation } from '@/constants/navigation';

export const PagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useAuth();

  useEffect(() => {
    if (!user || !company) {
      navigate('/login');
      return;
    }
  }, [company, user, navigate]);

  return (
    <PageContainer
      title="Pages"
      subtitle="Create and manage pages for your modules."
      sidebarItems={erpNavigation}
    >
      <div className="fade-in">
        <p className="muted-text">Page builder functionality is coming soon. This will allow you to create and customize pages for your modules.</p>
      </div>
    </PageContainer>
  );
};
