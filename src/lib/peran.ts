import { UserRole } from '@/types/database'

export interface MenuItem {
  title: string
  href: string
  icon: string
  roles: UserRole[]
}

export const MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['owner', 'admin', 'kepala_mekanik'],
  },
  {
    title: 'Work Order',
    href: '/work-orders',
    icon: 'Wrench',
    roles: ['owner', 'admin', 'kepala_mekanik'],
  },
  {
    title: 'Pelanggan',
    href: '/pelanggan',
    icon: 'Users',
    roles: ['owner', 'admin', 'kepala_mekanik'],
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: 'Package',
    roles: ['owner', 'admin', 'kepala_mekanik'],
  },
  {
    title: 'Tim Mekanik',
    href: '/tim-mekanik',
    icon: 'ShieldCheck',
    roles: ['owner', 'admin', 'kepala_mekanik'],
  },
  {
    title: 'Laporan Laba',
    href: '/laporan-laba',
    icon: 'TrendingUp',
    roles: ['owner'],
  },
  {
    title: 'Audit Log',
    href: '/audit-log',
    icon: 'History',
    roles: ['owner'],
  },
  {
    title: 'Pengguna',
    href: '/pengguna',
    icon: 'UserCog',
    roles: ['owner'],
  },
  {
    title: 'Setelan Bengkel',
    href: '/setelan',
    icon: 'Settings',
    roles: ['owner'],
  },
]

export function getMenuItemsForRole(role: UserRole): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.roles.includes(role))
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === 'owner') return true

  // Owner only routes
  const ownerOnlyRoutes = ['/laporan-laba', '/audit-log', '/pengguna', '/setelan']
  if (ownerOnlyRoutes.some((route) => pathname.startsWith(route))) {
    return false
  }

  // Work order baru route is for admin and owner
  if (pathname.startsWith('/work-orders/baru') && role === 'kepala_mekanik') {
    return false
  }

  return true
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin Meja Depan',
  kepala_mekanik: 'Kepala Mekanik',
}
