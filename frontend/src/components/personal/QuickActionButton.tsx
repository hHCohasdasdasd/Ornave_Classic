import React from 'react';

interface QuickActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onClick,
}) => {
  return (
    <button className="quick-action-btn" onClick={onClick}>
      <span className="quick-action-btn__icon">{icon}</span>
      <span className="quick-action-btn__label">{label}</span>
    </button>
  );
};
