import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconCompass, IconLayers, IconArticle, IconCalendar,
  IconBag, IconGroups, IconHeadset,
  IconEdit, IconSpark,
} from '@/components/ui/Icons';
import './ProfileSidebar.css';

interface ProfileSidebarProps {
  memberNumber?: string;
  memberTier?: string;
  verified?: boolean;
  onCreatePost?: () => void;
  onCreateStory?: () => void;
  onCreatePublication?: () => void;
}

const NAV_ITEMS: { label: string; icon: React.FC<{ size?: number }>; route?: string; action?: keyof ProfileSidebarProps }[] = [
  { label: 'Create Post', icon: IconEdit, action: 'onCreatePost' },
  { label: 'Create Story', icon: IconSpark, action: 'onCreateStory' },
  { label: 'Create Publication', icon: IconArticle, action: 'onCreatePublication' },
  { label: 'Discover', icon: IconCompass, route: '/network' },
  { label: 'Projects', icon: IconLayers, route: '/work-suite/files' },
  { label: 'Events', icon: IconCalendar, route: '/events' },
  { label: 'Marketplace', icon: IconBag, route: '/store' },
  { label: 'Groups', icon: IconGroups, route: '/groups' },
];

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  memberNumber, memberTier = 'Basic', verified = false,
  onCreatePost, onCreateStory, onCreatePublication,
}) => {
  const navigate = useNavigate();
  const actions: Partial<Record<string, () => void>> = { onCreatePost, onCreateStory, onCreatePublication };

  const tierLower = (memberTier || '').toLowerCase();
  const memberCardModifier = tierLower.includes('diamond') ? 'diamond'
    : tierLower.includes('gold') ? 'gold'
    : tierLower.includes('silver') ? 'silver'
    : tierLower.includes('bronze') ? 'bronze'
    : tierLower.includes('founding') ? 'founding'
    : 'basic';

  return (
    <aside className="profile-left-nav">
      <div className="profile-left-nav__logo" onClick={() => navigate('/home')}>ORNAVE</div>
      <nav className="profile-left-nav__list">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`profile-left-nav__item ${!item.route && !item.action ? 'profile-left-nav__item--inert' : ''}`}
            onClick={() => {
              if (item.action) actions[item.action]?.();
              else if (item.route) navigate(item.route);
            }}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {memberNumber && (
        <div className={`profile-left-nav__member-card profile-left-nav__member-card--${memberCardModifier}`}>
          <span className="profile-left-nav__member-eyebrow">Ornave</span>
          <span className="profile-left-nav__member-tier">{memberTier}</span>
          <span className="profile-left-nav__member-number">Member No.<br />{memberNumber}</span>
        </div>
      )}

      <button className="profile-left-nav__support profile-left-nav__support--disabled" disabled title="Coming soon">
        <IconHeadset size={15} />
        <span>Help &amp; Support</span>
      </button>
    </aside>
  );
};
