import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'default',
    loading = false,
    fullWidth = false,
    disabled,
    className = '',
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 transition-all duration-200 rounded-[12px] font-medium disabled:cursor-not-allowed';
    
    const variantStyles = {
      primary: 'bg-[#165DFF] text-white hover:bg-[#4080FF] active:bg-[#0E42D2] disabled:bg-[#94BFFF] disabled:text-white',
      secondary: 'bg-[#F2F3F5] text-[#1D2129] hover:bg-[#E5E6EB] active:bg-[#C9CDD4] disabled:bg-[#F2F3F5] disabled:text-[#C9CDD4]',
      ghost: 'bg-transparent text-[#165DFF] hover:bg-[#F2F3F5] active:bg-[#E5E6EB] disabled:text-[#C9CDD4]'
    };
    
    const sizeStyles = {
      default: 'h-[44px] px-6',
      large: 'h-[52px] px-8'
    };
    
    const widthStyles = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
