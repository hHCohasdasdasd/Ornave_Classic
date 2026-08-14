import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, TwoFactorRequiredError } from '@/context/AuthContext';
import { ValidationUtils, ErrorMessages } from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/api';

const AUTH_BYPASS_ENABLED = true;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, completeTwoFactorLogin, token, isLoading, error: authError, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const needsVerification = !!authError && authError.toLowerCase().includes('verify your email');
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingToken) return;
    try {
      await completeTwoFactorLogin(pendingToken, twoFactorCode.trim());
      navigate('/home');
    } catch {
      // Error is handled in context
    }
  };

  const handleResendVerification = async () => {
    setResendState('sending');
    try {
      await apiClient.post('/auth/resend-verification-by-email', { email });
    } finally {
      setResendState('sent');
    }
  };

  if (AUTH_BYPASS_ENABLED && token) {
    navigate('/home');
    return null;
  }

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!ValidationUtils.isValidEmail(email)) {
      errors.email = ErrorMessages.INVALID_EMAIL;
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      if (err instanceof TwoFactorRequiredError) {
        setPendingToken(err.pendingToken);
        return;
      }
      // Error is handled in context
    }
  };

  if (pendingToken) {
    return (
      <div className="auth-page fade-in">
        <div className="auth-card">
          <h1 className="auth-card__title">Two-factor authentication</h1>
          <p className="muted-text" style={{ marginBottom: '32px' }}>
            Enter the 6-digit code from your authenticator app, or one of your backup codes.
          </p>

          {authError && (
            <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '14px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleTwoFactorSubmit} className="form">
            <div className="form-group">
              <label>Authentication code</label>
              <input
                type="text"
                className="input"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="6-digit code or backup code"
                disabled={isLoading}
                autoFocus
                style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
              />
            </div>
            <Button type="submit" disabled={isLoading || !twoFactorCode.trim()} className="btn--primary">
              {isLoading ? 'Verifying…' : 'Verify'}
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
            <button
              type="button"
              onClick={() => { setPendingToken(null); setTwoFactorCode(''); setError(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--tech-blue)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '14px' }}
            >
              Back to login
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="auth-page fade-in">
        <div className="auth-card">
        <h1 className="auth-card__title">Welcome Back</h1>
        <p className="muted-text" style={{ marginBottom: '32px' }}>
          Access your ERP platform.
        </p>

        {authError && (
          <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '14px' }}>
            {authError}
            {needsVerification && (
              resendState === 'sent' ? (
                <div style={{ marginTop: '8px', color: 'var(--color-text)' }}>
                  If that address is registered, a new link is on its way.
                </div>
              ) : (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendState === 'sending' || !email}
                    style={{ background: 'none', border: 'none', color: 'var(--tech-blue)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '14px' }}
                  >
                    {resendState === 'sending' ? 'Sending…' : 'Resend verification email'}
                  </button>
                </div>
              )
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors({ ...fieldErrors, email: '' });
                }
              }}
              placeholder="e.g. name@company.com"
              disabled={isLoading}
              style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
            />
            {fieldErrors.email && <div style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{fieldErrors.email}</div>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors({ ...fieldErrors, password: '' });
                }
              }}
              placeholder="Your password"
              disabled={isLoading}
              style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
            />
            {fieldErrors.password && <div style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{fieldErrors.password}</div>}
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <a href="/forgot-password" style={{ color: 'var(--tech-blue)', fontSize: '13px', fontWeight: 700 }}>Forgot password?</a>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="btn--primary">
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          Don't have an account? <a href="/register" style={{ color: 'var(--tech-blue)', fontWeight: '800' }}>Register here</a>
        </p>
        </div>
      </div>
    </>
  );
};
