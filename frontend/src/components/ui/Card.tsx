import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ hoverable = false, className = '', children, ...props }) => {
  return (
    <div className={`card ${hoverable ? 'card--hover' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};
