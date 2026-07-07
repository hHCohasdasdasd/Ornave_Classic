import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import './ERPSnapshotCard.css';

interface SnapStats {
  pendingRequests: number;
  activeServices: number;
  totalRevenue: number;
}

export const ERPSnapshotCard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<SnapStats>({ pendingRequests: 0, activeServices: 0, totalRevenue: 0 });

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem('ornave_orders') || '[]');
    const pending = orders.filter((o: any) => o.status === 'PENDING').length;
    const active = orders.filter((o: any) => o.status === 'ACTIVE').length;
    const revenue = orders
      .filter((o: any) => o.status === 'COMPLETED')
      .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    setStats({ pendingRequests: pending, activeServices: active, totalRevenue: revenue });
  }, []);

  if (!user || user.userType !== 'COMPANY_USER') return null;

  return (
    <div className="erp-snapshot">
      <div className="erp-snapshot__header">
        <span className="erp-snapshot__label">Your Firm</span>
        <button className="erp-snapshot__go" onClick={() => navigate('/dashboard')}>
          Dashboard →
        </button>
      </div>

      <div className="erp-snapshot__stats">
        <div className="erp-snapshot__stat" onClick={() => navigate('/transactions')} title="View transactions">
          <div className="erp-snapshot__stat-value erp-snapshot__stat-value--alert">
            {stats.pendingRequests}
          </div>
          <div className="erp-snapshot__stat-label">Pending</div>
        </div>

        <div className="erp-snapshot__stat" onClick={() => navigate('/transactions')} title="Active services">
          <div className="erp-snapshot__stat-value">{stats.activeServices}</div>
          <div className="erp-snapshot__stat-label">Active</div>
        </div>

        <div className="erp-snapshot__stat" onClick={() => navigate('/transactions')} title="Revenue">
          <div className="erp-snapshot__stat-value erp-snapshot__stat-value--green">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <div className="erp-snapshot__stat-label">Revenue</div>
        </div>
      </div>

      <div className="erp-snapshot__actions">
        <button className="erp-snapshot__btn" onClick={() => navigate('/transactions')}>
          View Requests
        </button>
        <button className="erp-snapshot__btn erp-snapshot__btn--secondary" onClick={() => navigate('/global/store')}>
          Manage Services
        </button>
      </div>
    </div>
  );
};
