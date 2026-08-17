import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import { workSuiteService } from '@/services/workSuiteService';

const LINK_TOKEN_KEY = 'plaid_oauth_link_token';

/** European (and other PSD2/Open Banking) institutions send the user's
 * bank back to a page on our domain mid-Link-flow rather than resolving
 * everything inside the widget. This page picks that flow back up using
 * the link token stashed before redirecting out, then hands off to the
 * same exchange endpoint the in-app flow uses. */
export const PlaidOAuthRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'connecting' | 'error'>('connecting');
  const linkToken = typeof window !== 'undefined' ? localStorage.getItem(LINK_TOKEN_KEY) : null;

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    receivedRedirectUri: typeof window !== 'undefined' ? window.location.href : undefined,
    onSuccess: async (publicToken) => {
      if (!publicToken) return;
      try {
        await workSuiteService.exchangePlaidPublicToken(publicToken);
        localStorage.removeItem(LINK_TOKEN_KEY);
        navigate('/work-suite/finance');
      } catch {
        setStatus('error');
      }
    },
    onExit: () => {
      localStorage.removeItem(LINK_TOKEN_KEY);
      navigate('/work-suite/finance');
    },
  });

  useEffect(() => {
    if (!linkToken) {
      navigate('/work-suite/finance');
      return;
    }
    if (ready) open();
  }, [ready, open, linkToken, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--tech-text-dim)' }}>
      {status === 'error' ? 'Something went wrong connecting your bank — try again from the Finance page.' : 'Finishing bank connection…'}
    </div>
  );
};
