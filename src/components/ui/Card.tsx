import React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-white border border-[#EAF2FA] rounded-[12px] shadow-[0_1px_4px_rgba(16,24,40,0.06)] p-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between pb-4 mb-4 border-b border-[#EAF2FA]', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-[#212121]', className)} {...props}>
      {children}
    </h3>
  )
}
