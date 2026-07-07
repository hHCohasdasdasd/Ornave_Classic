import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/discovery';

interface UserCardProps {
  user: UserProfile;
  onConnect: (userId: string) => void;
  isLoading?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onConnect, isLoading }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    const profileUrl = `${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}`;
    navigate(`/profile?view=${profileUrl}`);
  };

  return (
    <div className="discovery-card">
      <div className="discovery-card__header">
        <div className="discovery-card__avatar" onClick={handleViewProfile} style={{ cursor: 'pointer' }}>
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={`${user.firstName} ${user.lastName}`} />
          ) : (
            <div className="discovery-card__avatar-placeholder">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          )}
        </div>

        <div className="discovery-card__content">
          <h3 className="discovery-card__name" onClick={handleViewProfile} style={{ cursor: 'pointer' }}>
            {user.firstName} {user.lastName}
          </h3>
          
          {user.headline && (
            <p className="discovery-card__headline">{user.headline}</p>
          )}
          
          {user.mutualConnections !== undefined && user.mutualConnections > 0 && (
            <p className="discovery-card__mutual">
              {user.mutualConnections} mutual connection{user.mutualConnections > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="discovery-card__actions">
        {user.isConnected ? (
          <button className="discovery-card__action-btn" disabled>
            ✓ Connected
          </button>
        ) : (
          <button
            className="discovery-card__action-btn discovery-card__action-btn--primary"
            onClick={() => onConnect(user.id)}
            disabled={isLoading}
          >
            + Connect
          </button>
        )}
      </div>
    </div>
  );
};
