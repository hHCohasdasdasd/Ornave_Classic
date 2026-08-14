import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { erpNavigation } from '@/constants/navigation';

interface LockedAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lockoutCount: number;
  permanentlyLocked: boolean;
  lockedUntil: string | null;
}

interface AuditLogEntry {
  id: string;
  email: string;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<'locked' | 'audit'>('locked');

  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([]);
  const [lockedLoading, setLockedLoading] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [emailFilter, setEmailFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (user === null) {
      navigate('/login');
      return;
    }
    if (user && user.isPlatformAdmin === false) {
      navigate('/home');
    }
  }, [user, navigate]);

  const loadLockedAccounts = async () => {
    setLockedLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/admin/locked-accounts');
      setLockedAccounts(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load locked accounts');
    } finally {
      setLockedLoading(false);
    }
  };

  const loadAuditLog = async () => {
    setAuditLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (emailFilter.trim()) params.email = emailFilter.trim();
      if (eventTypeFilter.trim()) params.eventType = eventTypeFilter.trim();
      const response = await apiClient.get('/admin/audit-log', { params });
      setAuditLog(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit log');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'locked') loadLockedAccounts();
    else loadAuditLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const unlockAccount = async (userId: string) => {
    setUnlockingId(userId);
    try {
      await apiClient.post(`/admin/locked-accounts/${userId}/unlock`);
      setLockedAccounts((prev) => prev.filter((a) => a.id !== userId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unlock account');
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <PageContainer
      title="Platform Administration"
      subtitle="Locked accounts and authentication audit trail."
      sidebarItems={erpNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '900px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-3)' }}>
          <Button onClick={() => setTab('locked')} disabled={tab === 'locked'}>Locked Accounts</Button>
          <Button onClick={() => setTab('audit')} disabled={tab === 'audit'}>Audit Log</Button>
        </div>

        {tab === 'locked' ? (
          <Card>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Locked Accounts</h3>
            {lockedLoading ? (
              <p className="muted-text">Loading…</p>
            ) : lockedAccounts.length === 0 ? (
              <p className="muted-text">No accounts are currently locked.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lockedAccounts.map((acct) => (
                  <div key={acct.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px', border: '1px solid var(--tech-border-dim)', borderRadius: '8px',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{acct.firstName} {acct.lastName} — {acct.email}</div>
                      <div className="muted-text" style={{ fontSize: '13px' }}>
                        {acct.permanentlyLocked
                          ? 'Permanently locked'
                          : `Locked until ${acct.lockedUntil ? new Date(acct.lockedUntil).toLocaleString() : '—'}`}
                        {' · '}Lifetime lockouts: {acct.lockoutCount}
                      </div>
                    </div>
                    <Button onClick={() => unlockAccount(acct.id)} disabled={unlockingId === acct.id}>
                      {unlockingId === acct.id ? 'Unlocking…' : 'Unlock'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Authentication Audit Log</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-3)' }}>
              <input
                type="text"
                className="input"
                placeholder="Filter by email"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
              />
              <input
                type="text"
                className="input"
                placeholder="Filter by event type (e.g. LOGIN_FAILED)"
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
              />
              <Button onClick={loadAuditLog} disabled={auditLoading}>
                {auditLoading ? 'Loading…' : 'Filter'}
              </Button>
            </div>
            {auditLoading ? (
              <p className="muted-text">Loading…</p>
            ) : auditLog.length === 0 ? (
              <p className="muted-text">No audit log entries match.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--tech-border-dim)' }}>
                      <th style={{ padding: '8px' }}>Time</th>
                      <th style={{ padding: '8px' }}>Event</th>
                      <th style={{ padding: '8px' }}>Email</th>
                      <th style={{ padding: '8px' }}>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((entry) => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--tech-border-dim)' }}>
                        <td style={{ padding: '8px' }}>{new Date(entry.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '8px' }}>{entry.eventType}</td>
                        <td style={{ padding: '8px' }}>{entry.email}</td>
                        <td style={{ padding: '8px' }}>{entry.ipAddress || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </PageContainer>
  );
};
