import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconCompass, IconUsers, IconBuilding, IconLayers, IconArticle, IconCalendar,
  IconBag, IconTrendingUp, IconGroups, IconBookmark, IconVerified, IconHeadset,
} from '@/components/ui/Icons';
import './ProfileSidebar.css';

interface ProfileSidebarProps {
  memberNumber?: string;
  memberTier?: string;
}

const NAV_ITEMS: { label: string; icon: React.FC<{ size?: number }>; route?: string }[] = [
  { label: 'Discover', icon: IconCompass, route: '/network' },
  { label: 'People', icon: IconUsers, route: '/network' },
  { label: 'Companies', icon: IconBuilding, route: '/firms' },
  { label: 'Projects', icon: IconLayers },
  { label: 'Articles', icon: IconArticle },
  { label: 'Events', icon: IconCalendar },
  { label: 'Marketplace', icon: IconBag, route: '/store' },
  { label: 'Investments', icon: IconTrendingUp },
  { label: 'Groups', icon: IconGroups, route: '/groups' },
  { label: 'Saved', icon: IconBookmark },
];

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ memberNumber, memberTier = 'Gold Member' }) => {
  const navigate = useNavigate();

  return (
    <aside className="profile-left-nav">
      <div className="profile-left-nav__logo" onClick={() => navigate('/home')}>ORNAVE</div>
      <nav className="profile-left-nav__list">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`profile-left-nav__item ${!item.route ? 'profile-left-nav__item--inert' : ''}`}
            onClick={() => item.route && navigate(item.route)}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {memberNumber && (
        <div className="profile-left-nav__member-card">
          <span className="profile-left-nav__member-eyebrow">ORNAVE</span>
          <span className="profile-left-nav__member-tier">{memberTier}</span>
          <span className="profile-left-nav__member-label">Member No.</span>
          <span className="profile-left-nav__member-number">{memberNumber}</span>
          <div className="profile-left-nav__member-badge">
            <IconVerified size={14} />
          </div>
        </div>
      )}

      <button className="profile-left-nav__support">
        <IconHeadset size={15} />
        <span>Help &amp; Support</span>
      </button>
    </aside>
  );
};
