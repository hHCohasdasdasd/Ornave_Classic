import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, SidebarItem } from './Sidebar';
import { Button } from './Button';
import { SectionHeader } from './SectionHeader';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  sidebarItems: SidebarItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  sidebarItems,
  actions,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <Sidebar items={sidebarItems} />
      <main className="page">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          actions={
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="tertiary" onClick={() => navigate('/home')}>
                Back to Home
              </Button>
              {actions}
            </div>
          }
        />
        <div className="page__content">{children}</div>
      </main>
    </div>
  );
};
