import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', fullWidth = false, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`button button--${variant}${fullWidth ? ' button--full' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    />
  );
}
