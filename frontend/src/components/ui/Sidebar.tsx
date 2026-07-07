import React from 'react';
import { NavLink } from 'react-router-dom';

export interface SidebarItem {
  label: string;
  to: string;
}

interface SidebarProps {
  title?: string;
  items: SidebarItem[];
  footer?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ title = 'Ornave', items, footer }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__logo">{title}</div>
      </div>
      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {footer && <div className="sidebar__footer">{footer}</div>}
    </aside>
  );
};
