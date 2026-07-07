import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  ...props
}) => {
  return (
    <button className={`btn btn--${variant} btn--${size} ${className}`} {...props}>
      {children}
    </button>
  );
};
