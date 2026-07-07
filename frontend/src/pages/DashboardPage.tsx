import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { erpNavigation } from '@/constants/navigation';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, company, logout } = useAuth();

  useEffect(() => {
    if (!user || !company) {
      navigate('/login');
    }
  }, [user, company, navigate]);

  if (!user || !company) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <PageContainer
      title={`Welcome, ${user.firstName}`}
      subtitle="Manage your company operations and global connections from a single control surface."
      sidebarItems={erpNavigation}
      actions={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="muted-text">{company.name}</span>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      }
    >
      <div className="grid fade-in">
        <Card hoverable>
          <div className="card__title">Company Settings</div>
          <div className="card__description">Update company information and settings.</div>
          <Button onClick={() => handleNavigate('/company-settings')}>Manage Settings</Button>
        </Card>

        <Card hoverable>
          <div className="card__title">ERP Modules</div>
          <div className="card__description">Configure modules and internal workflows.</div>
          <Button onClick={() => handleNavigate('/modules')}>Manage Modules</Button>
        </Card>

        <Card hoverable>
          <div className="card__title">Page Builder</div>
          <div className="card__description">Create structured pages for internal teams.</div>
          <Button onClick={() => handleNavigate('/pages')}>Build Pages</Button>
        </Card>

        <Card hoverable>
          <div className="card__title">Connections</div>
          <div className="card__description">Manage B2B relationships and permissions.</div>
          <Button onClick={() => handleNavigate('/connections')}>Manage Connections</Button>
        </Card>

        <Card hoverable>
          <div className="card__title">Clients</div>
          <div className="card__description">Monitor followers and service utilization.</div>
          <Button onClick={() => handleNavigate('/firm/clients')}>Manage Clients</Button>
        </Card>

        <Card hoverable>
          <div className="card__title">Transactions</div>
          <div className="card__description">Track requests, orders, and payments.</div>
          <Button onClick={() => handleNavigate('/transactions')}>View Transactions</Button>
        </Card>

        <Card hoverable>
          <div className="card__title">Messages</div>
          <div className="card__description">Secure communication with partners.</div>
          <Button onClick={() => handleNavigate('/messages')}>View Messages</Button>
        </Card>

        <Card hoverable>
          <div className="card__title">Ornave Global</div>
          <div className="card__description">Open the personal user layer.</div>
          <Button onClick={() => handleNavigate('/global/dashboard')}>Open Global</Button>
        </Card>
      </div>
    </PageContainer>
  );
};
