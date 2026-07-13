import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import { IconBuilding } from '@/components/ui/Icons';
import './ProfileHeroCard.css';

interface ProfileHeroCardProps {
  user: User;
  connectionCount: number;
  headline?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  phone?: string;
  website?: string;
  bio?: string;
  isViewingOther?: boolean;
  twitterUrl?: string;
  githubUrl?: string;
  type?: 'user' | 'firm';
  isPremium?: boolean;
}

export const ProfileHeroCard: React.FC<ProfileHeroCardProps> = ({
  user,
  connectionCount,
  headline,
  avatarUrl,
  bannerUrl,
  location,
  isViewingOther = false,
  twitterUrl,
  githubUrl,
  type = 'user',
  isPremium = false,
}) => {
  const navigate = useNavigate();
  const initials = type === 'firm' ? (user?.firstName?.substring(0, 2) || 'F') : `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
  const headlineText = headline?.trim() || (type === 'firm' ? 'No description yet' : 'No headline yet');

  return (
    <section className={`tech-hero ${isPremium ? 'tech-hero--premium' : ''}`}>
      <div className="tech-hero__banner">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Profile Banner" className="tech-hero__banner-img" />
        ) : (
          <div className="tech-hero__banner-grid"></div>
        )}
        <div className="tech-hero__banner-overlay"></div>
      </div>
      <div className="tech-hero__content-wrapper">
        <div className="tech-hero__biometric">
        <div className={`tech-hero__avatar-frame ${type === 'firm' ? 'tech-hero__avatar-frame--firm' : (isPremium ? 'tech-hero__avatar-frame--premium' : '')}`}>
          <div className="tech-hero__avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.firstName} className="tech-hero__avatar-img" />
            ) : (type === 'firm' ? <IconBuilding size={44} /> : initials)}
          </div>
        </div>
      </div>

      <div className="tech-hero__data">
        <div className="tech-hero__header">
          <h1 className="tech-hero__name">
            {type === 'firm' ? (
              <span className="tech-hero__name-full">{user?.firstName}</span>
            ) : (
              <>
                {user?.firstName || ''} <span className="tech-hero__accent">{user?.lastName || ''}</span>
              </>
            )}
          </h1>
          {!isViewingOther && (
            <button className="tech-hero__cmd-btn" onClick={() => navigate('/profile/edit?tab=info')}>
              Edit Profile
            </button>
          )}
        </div>

        <p className="tech-hero__headline">
          {headlineText}
        </p>

        <div className="tech-hero__metrics">
          <div className="tech-metric">
            <span className="tech-metric__label">Location</span>
            <span className="tech-metric__value">{location || 'Not set'}</span>
          </div>
          <div className="tech-metric">
            <span className="tech-metric__label">Connections</span>
            <span className="tech-metric__value">{connectionCount}</span>
          </div>
          <div className="tech-metric">
            <span className="tech-metric__label">Type</span>
            <span className="tech-metric__value">{type === 'firm' ? 'Company' : 'Individual'}</span>
          </div>
        </div>

        <div className="tech-hero__links">
          {githubUrl && <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="tech-link">GitHub</a>}
          {twitterUrl && <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="tech-link">Twitter</a>}
        </div>
      </div>
    </div>
    </section>
  );
};
