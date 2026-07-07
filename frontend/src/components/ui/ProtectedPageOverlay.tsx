import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProtectedPageOverlay.css';

interface ProtectedPageOverlayProps {
  isVisible: boolean;
}

export const ProtectedPageOverlay: React.FC<ProtectedPageOverlayProps> = ({ isVisible }) => {
  const navigate = useNavigate();

  if (!isVisible) return null;

  return (
    <div className="protected-page-overlay">
      <div className="protected-page-overlay__blur" />
      <div className="protected-page-overlay__content">
        <div className="protected-page-overlay__card">
          <div className="protected-page-overlay__icon">🔒</div>
          <h2 className="protected-page-overlay__title">Sign In Required</h2>
          <p className="protected-page-overlay__description">
            Please log in or create an account to access this page.
          </p>
          
          <div className="protected-page-overlay__buttons">
            <button
              className="protected-page-overlay__btn protected-page-overlay__btn--primary"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
            <button
              className="protected-page-overlay__btn protected-page-overlay__btn--secondary"
              onClick={() => navigate('/register')}
            >
              Create Account
            </button>
          </div>

          <p className="protected-page-overlay__footer">
            New to Ornave? <a href="/register">Create a free account</a>
          </p>
        </div>
      </div>
    </div>
  );
};
