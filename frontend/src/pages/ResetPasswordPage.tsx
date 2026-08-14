import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/Button';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('This reset link is missing its token.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <h1 className="auth-card__title">Set a new password</h1>

        {success ? (
          <>
            <p className="muted-text" style={{ marginBottom: '24px' }}>
              Your password has been reset. You can log in with it now.
            </p>
            <Button onClick={() => navigate('/login')} className="btn--primary">
              Go to login
            </Button>
          </>
        ) : !token ? (
          <p className="muted-text">
            This link is missing its token — request a new one from the{' '}
            <a href="/forgot-password" style={{ color: 'var(--tech-blue)', fontWeight: 800 }}>forgot password page</a>.
          </p>
        ) : (
          <>
            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>New password</label>
                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  disabled={isSubmitting}
                  style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
                />
              </div>
              <div className="form-group">
                <label>Confirm password</label>
                <input
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  disabled={isSubmitting}
                  style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="btn--primary">
                {isSubmitting ? 'Resetting…' : 'Reset password'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
