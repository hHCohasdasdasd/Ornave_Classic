import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';

interface ProfileCardProps {
  user: User;
  stats: {
    connectionCount: number;
    unreadMessages: number;
    notifications: number;
  };
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, stats }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(true);
  const [showOpenToModal, setShowOpenToModal] = React.useState(false);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  
  const memberSince = React.useMemo(() => {
    const parsed = new Date(user.createdAt);
    if (Number.isNaN(parsed.getTime())) {
      // If date is invalid, use current date as fallback
      return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [user.createdAt]);

  const handleAddSection = () => {
    navigate('/profile/edit?section=add');
  };

  const handleEnhanceProfile = () => {
    navigate('/profile/edit?tab=enhance');
  };

  const handleResources = () => {
    navigate('/profile/resources');
  };

  const handleShowDetails = () => {
    setShowDetailsModal(true);
  };

  return (
    <div className="profile-card">
      <div className="profile-card__top">
        <div className="profile-card__cover"></div>
        <div className="profile-card__avatar">
          <div className="profile-card__avatar-placeholder">
            {user.firstName[0]}{user.lastName[0]}
          </div>
        </div>
      </div>

      <div className="profile-card__content">
        <div className="profile-card__name-row">
          <button
            className="profile-card__name"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            title={isOpen ? 'Collapse profile' : 'Expand profile'}
          >
            <span className={`profile-card__toggle-icon ${isOpen ? 'open' : ''}`}>▼</span>
            {user.firstName} {user.lastName}
          </button>
          <span className="profile-card__badge">Verified</span>
          <button className="profile-card__edit" onClick={() => navigate('/profile/edit')}>
            Edit
          </button>
        </div>
        <p className="profile-card__headline">Global collaboration lead</p>
        <p className="profile-card__subheadline">Exploring new cross-border initiatives</p>
      </div>

      <div className={`profile-card__expanded ${isOpen ? 'profile-card__expanded--open' : ''}`}>
        <div className="profile-card__actions">
          <button 
            className="profile-card__action"
            onClick={handleAddSection}
          >
            Build profile
          </button>
          <button 
            className="profile-card__action"
            onClick={handleEnhanceProfile}
          >
            Complete profile
          </button>
          <button 
            className="profile-card__action"
            onClick={handleResources}
          >
            Resources
          </button>
        </div>

        <div className="profile-card__open-to">
          <div>
            <h4>Open to offers</h4>
            <p>Manager and Team Manager roles</p>
          </div>
          <button onClick={handleShowDetails}>Show details</button>
        </div>

        <div className="profile-card__snapshot">
          <div>
            <h5>Member since</h5>
            <p>{memberSince}</p>
          </div>
          <div>
            <h5>Account</h5>
            <p>{user.userType === 'USER' ? 'Personal' : 'Company'}</p>
          </div>
        </div>
      </div>

      {/* Open To Modal */}
      {showOpenToModal && (
        <div className="modal-overlay" onClick={() => setShowOpenToModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Your Availability Settings</h3>
              <button className="modal-close" onClick={() => setShowOpenToModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Configure your job search preferences and let recruiters know you're open to opportunities.</p>
              <button className="modal-action-btn" onClick={() => navigate('/profile/settings/open-to')}>
                Configure Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Availability Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Job Titles</h4>
                <p>Manager, Team Manager, Senior Manager</p>
              </div>
              <div className="detail-section">
                <h4>Location Preferences</h4>
                <p>Remote, Hybrid</p>
              </div>
              <div className="detail-section">
                <h4>Job Types</h4>
                <p>Full-time, Contract</p>
              </div>
              <button className="modal-action-btn" onClick={() => navigate('/profile/settings/open-to')}>
                Edit Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
