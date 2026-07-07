import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { IconEdit, IconInbox, IconBuilding, IconUser, IconCard } from '@/components/ui/Icons';
import './QuickActionsSidebar.css';

interface QuickActionsSidebarProps {
  onCreatePost?: () => void;
  onBrowseFirms?: () => void;
  onBrowsePeople?: () => void;
}

export const QuickActionsSidebar: React.FC<QuickActionsSidebarProps> = ({ 
  onCreatePost, 
  onBrowseFirms,
  onBrowsePeople 
}) => {
  const navigate = useNavigate();
  const { user, triggerAuthModal } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleActionClick = (action: { label: string, onClick: () => void, requiresAuth?: boolean }) => {
    if (action.requiresAuth && !user) {
      triggerAuthModal(`Please log in to ${action.label.toLowerCase()}.`);
      return;
    }
    action.onClick();
  };

  const actions = [
    {
      icon: <IconEdit />,
      label: 'New Post',
      onClick: onCreatePost || (() => navigate('/')),
      requiresAuth: true
    },
    {
      icon: <IconInbox />,
      label: 'Messages',
      onClick: () => navigate('/messages'),
      requiresAuth: true
    },
    {
      icon: <IconBuilding />,
      label: 'Companies',
      onClick: onBrowseFirms || (() => navigate('/network?tab=firms'))
    },
    {
      icon: <IconUser />,
      label: 'People',
      onClick: onBrowsePeople || (() => navigate('/network?tab=people'))
    },
    {
      icon: <IconCard />,
      label: 'Billing',
      onClick: () => navigate('/global/payments'),
      requiresAuth: true
    },
  ];

  return (
    <div
      className="quick-actions-sidebar"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={`quick-actions-sidebar__bar ${isExpanded ? 'quick-actions-sidebar__bar--expanded' : ''}`}>
        <div className="quick-actions-sidebar__content">
          {actions.map((action, index) => (
            <button
              key={index}
              className="quick-actions-sidebar__item"
              onClick={() => handleActionClick(action)}
              title={action.label}
            >
              <span className="quick-actions-sidebar__icon">{action.icon}</span>
              <span className="quick-actions-sidebar__label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
