import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#4A5565]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2 text-sm bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121] placeholder:text-[#757575] focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-transparent transition-all disabled:bg-slate-50 disabled:cursor-not-allowed',
            error && 'border-[#E53935] focus:ring-[#E53935]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#E53935]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#757575]">{helperText}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
