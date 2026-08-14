import React, { useState } from 'react';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() });
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <h1 className="auth-card__title">Reset your password</h1>

        {submitted ? (
          <>
            <p className="muted-text" style={{ marginBottom: '24px' }}>
              If that email is registered, a reset link is on its way — check your inbox.
            </p>
            <p style={{ textAlign: 'center', fontSize: '14px' }}>
              <a href="/login" style={{ color: 'var(--tech-blue)', fontWeight: 800 }}>Back to login</a>
            </p>
          </>
        ) : (
          <>
            <p className="muted-text" style={{ marginBottom: '32px' }}>
              Enter your account email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@company.com"
                  disabled={isSubmitting}
                  style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !email.trim()} className="btn--primary">
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
              <a href="/login" style={{ color: 'var(--tech-blue)', fontWeight: 800 }}>Back to login</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
