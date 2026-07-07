import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="section-header">
      <div>
        <h1 className="section-header__title">{title}</h1>
        {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="section-header__actions">{actions}</div>}
    </div>
  );
};
