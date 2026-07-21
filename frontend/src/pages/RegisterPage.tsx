import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ValidationUtils, ErrorMessages } from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { BUSINESS_TYPE_OPTIONS } from '@/utils/businessType';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error: authError, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPE_OPTIONS[0].value);
  const [accountType, setAccountType] = useState<'USER' | 'COMPANY_USER'>('COMPANY_USER');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!ValidationUtils.isValidEmail(email)) {
      errors.email = ErrorMessages.INVALID_EMAIL;
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (!ValidationUtils.isValidPassword(password)) {
      errors.password = ErrorMessages.INVALID_PASSWORD;
    }

    if (!firstName || firstName.trim().length < 2) {
      errors.firstName = 'First name is required (at least 2 characters)';
    }

    if (!lastName || lastName.trim().length < 2) {
      errors.lastName = 'Last name is required (at least 2 characters)';
    }

    if (accountType === 'COMPANY_USER' && (!companyName || companyName.trim().length < 2)) {
      errors.companyName = 'Company name is required (at least 2 characters)';
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
      // Pass companyName to register, which will create the company
      const companyPayload = accountType === 'COMPANY_USER' ? companyName : undefined;
      const businessTypePayload = accountType === 'COMPANY_USER' ? businessType : undefined;
      await register(email, password, firstName, lastName, companyPayload, accountType, businessTypePayload);
      navigate('/home');
    } catch (err) {
      // Error is handled in context
    }
  };

  return (
    <>
      <div className="auth-page fade-in">
        <div className="auth-card">
        <h1 className="auth-card__title">Create Account</h1>
        <p className="muted-text" style={{ marginBottom: '32px' }}>
          {accountType === 'COMPANY_USER' ? 'Set up your company ERP account.' : 'Create your personal account.'}
        </p>

        {authError && <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '14px' }}>{authError}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Account Type</label>
            <select
              className="select"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as 'USER' | 'COMPANY_USER')}
              disabled={isLoading}
              style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
            >
              <option value="COMPANY_USER">Company Account</option>
              <option value="USER">Personal Account</option>
            </select>
            <span className="helper-text" style={{ marginTop: '4px', display: 'block' }}>
              {accountType === 'COMPANY_USER' ? 'Manage ERP, modules, and company operations' : 'Collaborate across companies without managing one'}
            </span>
          </div>

          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              className="input"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (fieldErrors.firstName) {
                  setFieldErrors({ ...fieldErrors, firstName: '' });
                }
              }}
              disabled={isLoading}
              style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
            />
            {fieldErrors.firstName && <div style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{fieldErrors.firstName}</div>}
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              className="input"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (fieldErrors.lastName) {
                  setFieldErrors({ ...fieldErrors, lastName: '' });
                }
              }}
              disabled={isLoading}
              style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
            />
            {fieldErrors.lastName && <div style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{fieldErrors.lastName}</div>}
          </div>

          {accountType === 'COMPANY_USER' && (
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                className="input"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (fieldErrors.companyName) {
                    setFieldErrors({ ...fieldErrors, companyName: '' });
                  }
                }}
                disabled={isLoading}
                style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
              />
              {fieldErrors.companyName && <div style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{fieldErrors.companyName}</div>}
            </div>
          )}

          {accountType === 'COMPANY_USER' && (
            <div className="form-group">
              <label>Business Type</label>
              <select
                className="select"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                disabled={isLoading}
                style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
              >
                {BUSINESS_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                ))}
              </select>
              <span className="helper-text" style={{ marginTop: '4px', display: 'block' }}>
                Your profile layout is tailored to this — e.g. Restaurants get a Menu, Real Estate firms get Listings.
              </span>
            </div>
          )}

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
              disabled={isLoading}
              style={{ background: 'var(--color-input-bg)', color: 'white', border: '1px solid var(--tech-border-dim)' }}
            />
            {fieldErrors.password && <div style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{fieldErrors.password}</div>}
            <span className="helper-text" style={{ marginTop: '8px', display: 'block', lineHeight: '1.4' }}>
              At least 8 chars with uppercase, lowercase, number, and special character
            </span>
          </div>

          <Button type="submit" disabled={isLoading} className="btn--primary">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          Already have an account? <a href="/login" style={{ color: 'var(--tech-blue)', fontWeight: '800' }}>Login here</a>
        </p>
        </div>
      </div>
    </>
  );
};
