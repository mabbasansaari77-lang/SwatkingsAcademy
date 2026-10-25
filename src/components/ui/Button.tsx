import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router';
import { buttonClass, type Size, type Variant } from './buttonClass';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'navy', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

interface LinkButtonProps {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}

export function LinkButton({ to, variant = 'navy', size = 'md', className = '', onClick, children }: LinkButtonProps) {
  return (
    <Link to={to} onClick={onClick} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
