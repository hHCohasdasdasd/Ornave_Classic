import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { erpNavigation } from '@/constants/navigation';

export const AccountSecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(!!user?.twoFactorEnabled);
  const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [enableCode, setEnableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const startSetup = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/2fa/setup');
      setSetupData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/2fa/enable', { code: enableCode.trim() });
      setBackupCodes(response.data.data.backupCodes);
      setTwoFactorEnabled(true);
      setSetupData(null);
      setEnableCode('');
      setSuccess('Two-factor authentication is now enabled.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await apiClient.post('/auth/2fa/disable', { password: disablePassword });
      setTwoFactorEnabled(false);
      setShowDisableForm(false);
      setDisablePassword('');
      setSuccess('Two-factor authentication has been disabled.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Incorrect password');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    setIsDeleting(true);
    try {
      await apiClient.post('/auth/delete-account', { password: deletePassword });
      logout();
      navigate('/login');
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer
      title="Account Security"
      subtitle="Manage two-factor authentication and your account."
      sidebarItems={erpNavigation}
    >
      <div className="fade-in" style={{ maxWidth: '700px' }}>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error}</div>}
        {success && <div style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-3)' }}>{success}</div>}

        <Card style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Two-Factor Authentication</h3>

          {backupCodes ? (
            <div>
              <p className="muted-text" style={{ marginBottom: 'var(--space-2)' }}>
                Save these backup codes somewhere safe. Each can be used once if you lose access to your
                authenticator app. They won't be shown again.
              </p>
              <div style={{
                background: 'var(--color-input-bg)',
                border: '1px solid var(--tech-border-dim)',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'monospace',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: 'var(--space-3)',
              }}>
                {backupCodes.map((code) => <span key={code}>{code}</span>)}
              </div>
              <Button onClick={() => setBackupCodes(null)}>Done</Button>
            </div>
          ) : twoFactorEnabled ? (
            <div>
              <p className="muted-text" style={{ marginBottom: 'var(--space-3)' }}>
                Two-factor authentication is <strong>enabled</strong> on your account.
              </p>
              {showDisableForm ? (
                <form onSubmit={disable2FA} className="form">
                  <div className="form-group">
                    <label>Confirm your password to disable</label>
                    <input
                      type="password"
                      className="input"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button type="submit" disabled={isLoading || !disablePassword}>
                      {isLoading ? 'Disabling…' : 'Disable 2FA'}
                    </Button>
                    <Button type="button" onClick={() => setShowDisableForm(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <Button onClick={() => setShowDisableForm(true)}>Disable two-factor authentication</Button>
              )}
            </div>
          ) : setupData ? (
            <div>
              <p className="muted-text" style={{ marginBottom: 'var(--space-2)' }}>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter
                the 6-digit code it shows.
              </p>
              <img src={setupData.qrCodeDataUrl} alt="2FA QR code" style={{ background: '#fff', padding: '12px', borderRadius: '8px', marginBottom: 'var(--space-2)' }} />
              <p className="muted-text" style={{ fontSize: '12px', marginBottom: 'var(--space-3)' }}>
                Can't scan? Enter this key manually: <code>{setupData.secret}</code>
              </p>
              <form onSubmit={confirmEnable} className="form">
                <div className="form-group">
                  <label>6-digit code</label>
                  <input
                    type="text"
                    className="input"
                    value={enableCode}
                    onChange={(e) => setEnableCode(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button type="submit" disabled={isLoading || !enableCode.trim()}>
                    {isLoading ? 'Confirming…' : 'Confirm and enable'}
                  </Button>
                  <Button type="button" onClick={() => setSetupData(null)}>Cancel</Button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <p className="muted-text" style={{ marginBottom: 'var(--space-3)' }}>
                Two-factor authentication is currently <strong>disabled</strong>. Enabling it requires a code
                from your authenticator app in addition to your password when logging in.
              </p>
              <Button onClick={startSetup} disabled={isLoading}>
                {isLoading ? 'Starting…' : 'Enable two-factor authentication'}
              </Button>
            </div>
          )}
        </Card>

        <Card style={{ borderColor: 'var(--color-danger)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--color-danger)' }}>Delete Account</h3>
          <p className="muted-text" style={{ marginBottom: 'var(--space-3)' }}>
            This permanently deactivates your account and scrambles your personal information. This cannot
            be undone.
          </p>
          {deleteError && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{deleteError}</div>}
          {showDeleteForm ? (
            <form onSubmit={deleteAccount} className="form">
              <div className="form-group">
                <label>Confirm your password to permanently delete your account</label>
                <input
                  type="password"
                  className="input"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  disabled={isDeleting}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="submit" disabled={isDeleting || !deletePassword}>
                  {isDeleting ? 'Deleting…' : 'Permanently delete my account'}
                </Button>
                <Button type="button" onClick={() => setShowDeleteForm(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setShowDeleteForm(true)}>Delete my account</Button>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};
