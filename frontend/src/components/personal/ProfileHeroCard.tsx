import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import { IconBuilding, IconVerified } from '@/components/ui/Icons';
import './ProfileHeroCard.css';

export interface HeroStat {
  label: string;
  value: string | number;
}

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
  focusAreas?: string[];
  editorial?: boolean;
  verified?: boolean;
  stats?: HeroStat[];
  memberSince?: string;
  memberNumber?: string;
  memberTier?: string;
  company?: string;
  hasStory?: boolean;
  onViewStory?: () => void;
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
  focusAreas,
  editorial = false,
  verified = false,
  stats,
  memberSince,
  memberNumber,
  memberTier = 'Ornave Member',
  company,
  hasStory = false,
  onViewStory,
}) => {
  const navigate = useNavigate();
  const initials = type === 'firm' ? (user?.firstName?.substring(0, 2) || 'F') : `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
  const headlineText = headline?.trim() || (type === 'firm' ? 'No description yet' : 'No headline yet');

  return (
    <section className={`tech-hero ${isPremium ? 'tech-hero--premium' : ''} ${editorial ? 'tech-hero--editorial' : ''}`}>
      <div className="tech-hero__banner">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Profile Banner" className="tech-hero__banner-img" />
        ) : (
          <div className="tech-hero__banner-grid"></div>
        )}
        <div className="tech-hero__banner-overlay"></div>
        {editorial && memberNumber && (
          <div className="tech-hero__member-card">
            <span className="tech-hero__member-card-eyebrow">Ornave</span>
            <span className="tech-hero__member-card-tier">{memberTier}</span>
            <span className="tech-hero__member-card-number">Member No.<br />{memberNumber}</span>
          </div>
        )}
      </div>
      <div className="tech-hero__content-wrapper">
        <div className="tech-hero__biometric">
        <div className="tech-hero__avatar-anchor">
          <div
            className={`tech-hero__avatar-frame ${type === 'firm' ? 'tech-hero__avatar-frame--firm' : (isPremium ? 'tech-hero__avatar-frame--premium' : '')} ${hasStory ? 'tech-hero__avatar-frame--story' : ''}`}
            onClick={hasStory ? onViewStory : undefined}
            style={hasStory ? { cursor: 'pointer' } : undefined}
          >
            <div className="tech-hero__avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.firstName} className="tech-hero__avatar-img" />
              ) : (type === 'firm' ? <IconBuilding size={44} /> : initials)}
            </div>
          </div>
          {editorial && verified && (
            <div className="tech-hero__avatar-badge">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 1.6 12 3l2.5-.3 1 2.3 2.3 1-.3 2.5 1.4 2-1.4 2 .3 2.5-2.3 1-1 2.3L12 17l-2 1.4-2-1.4-2.5.3-1-2.3-2.3-1 .3-2.5L1.1 10l1.4-2-.3-2.5 2.3-1 1-2.3L8 1.6l2 .4Z" />
              </svg>
            </div>
          )}
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
            {verified && <IconVerified size={22} className="tech-hero__verified-badge" />}
          </h1>
          {!isViewingOther && !editorial && (
            <button className="tech-hero__cmd-btn" onClick={() => navigate('/profile/edit?tab=info')}>
              Edit Profile
            </button>
          )}
        </div>

        <p className="tech-hero__headline">
          {headlineText}
        </p>
        {company && <p className="tech-hero__company">{company}</p>}

        {editorial && memberSince && (
          <p className="tech-hero__member-since">Member since {memberSince}</p>
        )}
      </div>
    </div>

    <div className="tech-hero__extra">
        {focusAreas && focusAreas.length > 0 && (
          <div className="tech-hero__focus-tags">
            {focusAreas.map((tag) => (
              <span key={tag} className="tech-hero__focus-tag">{tag}</span>
            ))}
          </div>
        )}

        {editorial && stats && stats.length > 0 ? (
          <div className="tech-hero__stats-row">
            {stats.map((s) => (
              <div key={s.label} className="tech-hero__stat">
                <span className="tech-hero__stat-value">{s.value}</span>
                <span className="tech-hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        ) : (
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
        )}

        <div className="tech-hero__links">
          {editorial && stats && stats.length > 0 && location && <span className="tech-link tech-link--static">{location}</span>}
          {githubUrl && <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="tech-link">GitHub</a>}
          {twitterUrl && <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="tech-link">Twitter</a>}
        </div>
    </div>
    </section>
  );
};
