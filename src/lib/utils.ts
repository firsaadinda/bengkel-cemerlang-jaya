import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { WOStatus } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return 'Rp0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val).replace(/\s+/g, '')
}

export function formatCompactRupiah(val: number | null | undefined): string {
  if (!val) return '0'
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`
  }
  return val.toString()
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatPlat(plat: string): string {
  return plat.toUpperCase().replace(/\s+/g, ' ').trim()
}

export const STATUS_WO_CONFIG: Record<
  WOStatus,
  { label: string; color: string; badgeClass: string; desc: string }
> = {
  menunggu: {
    label: 'Menunggu',
    color: '#9E9E9E',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'WO dibuat, belum dikerjakan',
  },
  dikerjakan: {
    label: 'Dikerjakan',
    color: '#2196F3',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Mekanik sudah ditunjuk dan bekerja',
  },
  tertunda: {
    label: 'Tertunda',
    color: '#F59E0B',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Berhenti sementara, misalnya menunggu part',
  },
  selesai: {
    label: 'Selesai Dikerjakan',
    color: '#7E57C2',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Pengerjaan selesai, menunggu QC',
  },
  siap_diambil: {
    label: 'Siap Diambil',
    color: '#4CAF50',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Lulus QC, siap ditagih dan diambil',
  },
  diambil: {
    label: 'Diambil',
    color: '#2E7D32',
    badgeClass: 'bg-green-100 text-green-800 border-green-300',
    desc: 'Lunas dan mobil sudah diserahkan',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    color: '#E53935',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Dibatalkan dengan alasan',
  },
}
