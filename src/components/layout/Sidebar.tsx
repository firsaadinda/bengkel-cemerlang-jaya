'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Wrench,
  Users,
  Package,
  ShieldCheck,
  TrendingUp,
  History,
  UserCog,
  Settings,
  LogOut,
  Car,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMenuItemsForRole, ROLE_LABELS } from '@/lib/peran'
import { Profile, UserRole } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Wrench,
  Users,
  Package,
  ShieldCheck,
  TrendingUp,
  History,
  UserCog,
  Settings,
}

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const menuItems = getMenuItemsForRole(profile.role)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-white border-r border-[#EAF2FA] flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand / Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-[#EAF2FA]">
          <div className="w-16 h-8 flex items-center justify-center shrink-0">
            <img
              src="/images/logo-car-silhouette.svg"
              alt="Logo Bengkel Cemerlang Jaya"
              className="w-full h-auto object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-stone-900 uppercase">Cemerlang Jaya</h1>
            <p className="text-[11px] text-rose-700 font-bold uppercase tracking-wider">Spesialis Mobil</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-rose-50 text-rose-700 font-semibold border-r-2 border-rose-700'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-rose-700'
                )}
              >
                <Icon
                  className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#1976D2]' : 'text-[#757575]')}
                />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-[#EAF2FA] bg-[#F2F9FE]/60">
        <div className="flex items-center justify-between mb-3">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-semibold text-[#212121] truncate">{profile.nama}</p>
            <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold bg-[#DCEBFB] text-[#1976D2] rounded-full">
              {ROLE_LABELS[profile.role as UserRole] || profile.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#E53935] hover:bg-rose-50 rounded-[8px] transition-colors border border-rose-100 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}

