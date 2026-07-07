import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import './AuthModal.css';

export const AuthModal: React.FC = () => {
  const navigate = useNavigate();
  const { showAuthModal, setShowAuthModal, authModalMessage } = useAuth();

  if (!showAuthModal) return null;

  return (
    <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal__close" onClick={() => setShowAuthModal(false)}>×</div>
        <div className="auth-modal__icon">👋</div>
        <h3 className="auth-modal__title">Join Ornave</h3>
        <p className="auth-modal__message">{authModalMessage}</p>
        <div className="auth-modal__actions">
          <button 
            className="btn-primary" 
            style={{ padding: '12px' }}
            onClick={() => {
              setShowAuthModal(false);
              navigate('/login');
            }}
          >
            Sign In
          </button>
          <button 
            className="btn-secondary" 
            style={{ padding: '12px' }}
            onClick={() => {
              setShowAuthModal(false);
              navigate('/register');
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};
