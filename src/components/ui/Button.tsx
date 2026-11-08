import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-[10px] cursor-pointer'

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    }

    const variantStyles = {
      primary: 'bg-[#2196F3] text-white hover:bg-[#1976D2] focus:ring-[#2196F3]',
      secondary: 'bg-[#DCEBFB] text-[#1976D2] hover:bg-[#cbe2f8] focus:ring-[#2196F3]',
      outline: 'border border-[#EAF2FA] bg-white text-[#212121] hover:bg-[#F2F9FE] focus:ring-[#2196F3]',
      danger: 'bg-[#E53935] text-white hover:bg-[#c62828] focus:ring-[#E53935]',
      ghost: 'bg-transparent text-[#4A5565] hover:bg-[#F2F9FE] hover:text-[#212121]',
      success: 'bg-[#2E7D32] text-white hover:bg-[#1b5e20] focus:ring-[#2E7D32]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

