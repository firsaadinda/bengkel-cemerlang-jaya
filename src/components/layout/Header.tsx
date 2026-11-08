'use client'

import React from 'react'
import { Bell, Search } from 'lucide-react'
import { Profile, UserRole } from '@/types/database'
import { ROLE_LABELS } from '@/lib/peran'

interface HeaderProps {
  profile: Profile
  title?: string
}

export function Header({ profile, title }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-[#EAF2FA] px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-semibold text-[#212121]">{title || 'Dashboard'}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs font-medium text-[#212121]">{profile.nama}</p>
          <p className="text-[11px] text-[#757575]">{ROLE_LABELS[profile.role as UserRole]}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#DCEBFB] text-[#1976D2] font-semibold text-xs flex items-center justify-center border border-blue-200">
          {profile.nama.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}

