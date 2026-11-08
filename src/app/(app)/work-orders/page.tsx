'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Search, Filter, Wrench, Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, WorkOrder, WOStatus } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatRupiah, formatDate, STATUS_WO_CONFIG } from '@/lib/utils'

const STATUS_LIST: { id: string; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'menunggu', label: 'Menunggu' },
  { id: 'dikerjakan', label: 'Dikerjakan' },
  { id: 'tertunda', label: 'Tertunda' },
  { id: 'selesai', label: 'Selesai' },
  { id: 'siap_diambil', label: 'Siap Diambil' },
  { id: 'diambil', label: 'Diambil' },
  { id: 'dibatalkan', label: 'Dibatalkan' },
]

function WorkOrdersList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('status') || 'semua')
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('cari') || '')
  const [filterTim, setFilterTim] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const pageSize = 20

  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [teams, setTeams] = useState<Profile[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (prof) {
        setProfile(prof as Profile)
        // If Kepala Mekanik, filter default to their team
        if (prof.role === 'kepala_mekanik') {
          setFilterTim(prof.id)
        }
      }

      // Load all kepala mekanik teams for filter dropdown
      const { data: kepalaList } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'kepala_mekanik')
        .eq('aktif', true)
      if (kepalaList) setTeams(kepalaList as Profile[])
    }
    loadUser()
  }, [])

  useEffect(() => {
    async function fetchWorkOrders() {
      setIsLoading(true)

      try {
        // Query status counts
        const { data: countData } = await supabase.rpc('dashboard_wo_per_status', {
          p_tim: filterTim || null,
        })
        if (countData) {
          const map: Record<string, number> = {}
          let sum = 0
          countData.forEach((row: any) => {
            map[row.status] = Number(row.jumlah)
            sum += Number(row.jumlah)
          })
          map['semua'] = sum
          setStatusCounts(map)
        }

        // Build main query
        let query = supabase
          .from('work_orders')
          .select(
            `
            id, nomor, status, odometer, keluhan, estimasi_selesai, created_at,
            vehicles(id, plat, merek_model),
            customers(id, nama, telepon),
            kepala_mekanik:kepala_mekanik_id(id, nama),
            invoices(total, status_bayar)
          `,
            { count: 'exact' }
          )
          .order('created_at', { ascending: false })

        if (activeTab !== 'semua') {
          query = query.eq('status', activeTab)
        }

        if (filterTim) {
          query = query.eq('kepala_mekanik_id', filterTim)
        }

        if (searchTerm.trim()) {
          query = query.or(
            `nomor.ilike.%${searchTerm.trim()}%,keluhan.ilike.%${searchTerm.trim()}%`
          )
        }

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        const { data, count, error } = await query

        if (data) {
          setWorkOrders(data)
          setTotalCount(count || 0)
        }
      } catch (err) {
        console.error('Error fetching work orders:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkOrders()
  }, [activeTab, filterTim, searchTerm, page])

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#212121]">Work Order</h1>
          <p className="text-xs text-[#757575] mt-0.5">
            Daftar perjalanan servis dan status pengerjaan kendaraan
          </p>
        </div>

        {profile && profile.role !== 'kepala_mekanik' && (
          <Link href="/work-orders/baru">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              <span>+ Work Order Baru</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs Status */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-[#EAF2FA] text-xs font-medium">
        {STATUS_LIST.map((tab) => {
          const count = statusCounts[tab.id] ?? 0
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setPage(1)
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#2196F3] text-white font-semibold shadow-xs'
                  : 'text-[#4A5565] hover:bg-white hover:text-[#212121]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#4A5565]'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#757575]" />
          <input
            type="text"
            placeholder="Cari nomor WO, keluhan, dll..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
          />
        </div>

        <div>
          <select
            value={filterTim}
            onChange={(e) => {
              setFilterTim(e.target.value)
              setPage(1)
            }}
            className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
          >
            <option value="">Semua Tim Kepala Mekanik</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F9FE] border-b border-[#EAF2FA] text-[#757575] font-semibold">
              <tr>
                <th className="px-5 py-3.5">No WO</th>
                <th className="px-4 py-3.5">Plat Nomor</th>
                <th className="px-4 py-3.5">Pelanggan</th>
                <th className="px-4 py-3.5">Tim (Kepala Mekanik)</th>
                <th className="px-4 py-3.5">Estimasi Selesai</th>
                <th className="px-4 py-3.5">Total Tagihan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2FA]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[#757575]">
                    Memuat data work order...
                  </td>
                </tr>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#757575]">
                    Tidak ada Work Order yang ditemukan.
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => {
                  const conf = STATUS_WO_CONFIG[wo.status as WOStatus]
                  const isLate =
                    wo.estimasi_selesai &&
                    new Date(wo.estimasi_selesai) < new Date() &&
                    !['selesai', 'siap_diambil', 'diambil', 'dibatalkan'].includes(wo.status)

                  return (
                    <tr
                      key={wo.id}
                      onClick={() => router.push(`/work-orders/${wo.id}`)}
                      className="hover:bg-[#F2F9FE]/70 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-[#212121]">{wo.nomor}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-[#1976D2]">{wo.vehicles?.plat || '-'}</span>
                        <p className="text-[11px] text-[#757575] truncate max-w-[140px]">
                          {wo.vehicles?.merek_model}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[#212121]">{wo.customers?.nama || '-'}</p>
                        <p className="text-[11px] text-[#757575]">{wo.customers?.telepon}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[#4A5565]">
                        {wo.kepala_mekanik?.nama || '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#4A5565]">
                            {wo.estimasi_selesai ? formatDate(wo.estimasi_selesai) : '-'}
                          </span>
                          {isLate && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-700 rounded-full">
                              Terlambat
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#212121] tabular-nums">
                        {wo.invoices?.total ? formatRupiah(wo.invoices.total) : '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full border ${conf.badgeClass}`}>
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/work-orders/${wo.id}`)
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Rincian
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-[#EAF2FA] flex items-center justify-between text-xs text-[#757575]">
          <span>
            Menampilkan {workOrders.length} dari {totalCount} WO
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#EAF2FA] hover:bg-[#F2F9FE] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-[#212121]">
              Halaman {page} dari {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-[#EAF2FA] hover:bg-[#F2F9FE] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#757575]">Memuat daftar work order...</div>}>
      <WorkOrdersList />
    </Suspense>
  )
}

