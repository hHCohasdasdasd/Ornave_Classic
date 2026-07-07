import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { PersonalHomePage } from './PersonalHomePage';

export const HomePage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ background: 'var(--color-bg)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
        <span>Loading...</span>
      </div>
    );
  }

  return <PersonalHomePage user={user ?? null} />;
};
