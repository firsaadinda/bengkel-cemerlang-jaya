'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  DollarSign,
  Percent,
  Clock,
  AlertTriangle,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Package,
  Wrench,
  Users,
  ArrowRight,
  ShieldAlert,
  Car,
  ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserRole, WOStatus } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatRupiah, formatCompactRupiah, formatDate, formatDateTime, STATUS_WO_CONFIG } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'month'>('month')
  const [isLoading, setIsLoading] = useState(true)

  // Data State
  const [kpi, setKpi] = useState<any>({})
  const [revenueDaily, setRevenueDaily] = useState<any[]>([])
  const [woStatusData, setWoStatusData] = useState<any[]>([])
  const [mechanicLoad, setMechanicLoad] = useState<any[]>([])
  const [woFinishedDaily, setWoFinishedDaily] = useState<any[]>([])
  const [topParts, setTopParts] = useState<any[]>([])
  const [topServices, setTopServices] = useState<any[]>([])
  const [recentAudits, setRecentAudits] = useState<any[]>([])
  const [attentionWos, setAttentionWos] = useState<any[]>([])
  const [readyDeliverWos, setReadyDeliverWos] = useState<any[]>([])
  const [lowStocks, setLowStocks] = useState<any[]>([])
  const [teamQueue, setTeamQueue] = useState<any[]>([])

  // Search plat state for Admin
  const [searchPlat, setSearchPlat] = useState('')

  // Calculate start & end date for the selected period
  const getDateRange = () => {
    const now = new Date()
    const end = now.toISOString()
    let start = new Date()

    if (period === 'today') {
      start.setHours(0, 0, 0, 0)
    } else if (period === '7days') {
      start.setDate(now.getDate() - 7)
    } else if (period === '30days') {
      start.setDate(now.getDate() - 30)
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return { start: start.toISOString(), end }
  }

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (prof) {
        setProfile(prof as Profile)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    async function fetchData() {
      if (!profile) return
      const userProfile = profile
      setIsLoading(true)
      const { start, end } = getDateRange()

      try {
        // 1. KPI Ringkasan
        const { data: kpiData } = await supabase.rpc('dashboard_ringkasan', {
          p_dari: start,
          p_sampai: end,
        })
        if (kpiData) setKpi(kpiData)

        // 2. WO per Status
        const { data: statusData } = await supabase.rpc('dashboard_wo_per_status', {
          p_tim: userProfile.role === 'kepala_mekanik' ? userProfile.id : null,
        })
        if (statusData) setWoStatusData(statusData)

        // Data berdasarkan Peran
        if (userProfile.role === 'owner') {
          // Pendapatan harian
          const { data: revData } = await supabase.rpc('dashboard_pendapatan_harian', {
            p_dari: start,
            p_sampai: end,
          })
          if (revData) setRevenueDaily(revData)

          // Beban Mekanik
          const { data: bebanData } = await supabase.rpc('dashboard_beban_mekanik', {
            p_dari: start,
            p_sampai: end,
          })
          if (bebanData) setMechanicLoad(bebanData)

          // Top Items
          const { data: tp } = await supabase.rpc('dashboard_top_item', {
            p_dari: start,
            p_sampai: end,
            p_jenis: 'part',
          })
          if (tp) setTopParts(tp)

          const { data: ts } = await supabase.rpc('dashboard_top_item', {
            p_dari: start,
            p_sampai: end,
            p_jenis: 'jasa',
          })
          if (ts) setTopServices(ts)

          // Audit log 8 terakhir
          const { data: audits } = await supabase
            .from('audit_logs')
            .select('*')
            .order('waktu', { ascending: false })
            .limit(8)
          if (audits) setRecentAudits(audits)

          // Perhatian: WO Terlambat
          const { data: lateWos } = await supabase
            .from('work_orders')
            .select('*, vehicles(plat), customers(nama)')
            .in('status', ['menunggu', 'dikerjakan', 'tertunda'])
            .lt('estimasi_selesai', new Date().toISOString().split('T')[0])
            .limit(5)
          if (lateWos) setAttentionWos(lateWos)

        } else if (userProfile.role === 'admin') {
          // Pendapatan 7 hari
          const { data: revData } = await supabase.rpc('dashboard_pendapatan_harian', {
            p_dari: new Date(Date.now() - 7 * 86400000).toISOString(),
            p_sampai: new Date().toISOString(),
          })
          if (revData) setRevenueDaily(revData)

          // Perlu Ditagih (siap_diambil)
          const { data: needBill } = await supabase
            .from('work_orders')
            .select('*, vehicles(plat), customers(nama), invoices(total, status_bayar)')
            .eq('status', 'siap_diambil')
            .limit(6)
          if (needBill) setAttentionWos(needBill)

          // Siap Diserahkan (invoice lunas tapi belum diambil)
          const { data: readyDeliver } = await supabase
            .from('work_orders')
            .select('*, vehicles(plat), customers(nama), invoices(status_bayar)')
            .eq('status', 'siap_diambil')
            .limit(6)
          if (readyDeliver) {
            setReadyDeliverWos(readyDeliver.filter((w) => w.invoices?.status_bayar === 'lunas'))
          }

          // Stok Menipis
          const { data: lowStockData } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('jenis', 'part')
            .eq('aktif', true)
            .order('stok', { ascending: true })
            .limit(5)
          if (lowStockData) {
            setLowStocks(lowStockData.filter((i) => i.stok <= i.stok_minimum))
          }

        } else if (userProfile.role === 'kepala_mekanik') {
          // Beban Mekanik Tim
          const { data: bebanData } = await supabase.rpc('dashboard_beban_mekanik', {
            p_dari: start,
            p_sampai: end,
            p_tim: userProfile.id,
          })
          if (bebanData) setMechanicLoad(bebanData)

          // WO Selesai harian
          const { data: selesaiData } = await supabase.rpc('dashboard_wo_selesai_harian', {
            p_dari: start,
            p_sampai: end,
          })
          if (selesaiData) setWoFinishedDaily(selesaiData)

          // Antrean tim
          const { data: queue } = await supabase
            .from('work_orders')
            .select('*, vehicles(plat, merek_model), customers(nama)')
            .eq('kepala_mekanik_id', userProfile.id)
            .in('status', ['menunggu', 'dikerjakan', 'tertunda', 'selesai'])
            .order('estimasi_selesai', { ascending: true, nullsFirst: false })
            .limit(8)
          if (queue) setTeamQueue(queue)
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [profile, period])

  const handleSearchPlat = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchPlat.trim()) {
      router.push(`/work-orders?cari=${encodeURIComponent(searchPlat.trim())}`)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2196F3]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#212121]">
            Dashboard {profile.role === 'owner' ? 'Owner' : profile.role === 'admin' ? 'Kasir & Front Office' : 'Tim Kepala Mekanik'}
          </h1>
          <p className="text-xs text-[#757575] mt-0.5">
            Ringkasan kondisi operasional dan metrik performa bengkel terkini
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#EAF2FA] rounded-[10px] self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer ${
              period === 'today' ? 'bg-[#2196F3] text-white font-semibold' : 'text-[#4A5565] hover:bg-[#F2F9FE]'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer ${
              period === '7days' ? 'bg-[#2196F3] text-white font-semibold' : 'text-[#4A5565] hover:bg-[#F2F9FE]'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setPeriod('30days')}
            className={`px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer ${
              period === '30days' ? 'bg-[#2196F3] text-white font-semibold' : 'text-[#4A5565] hover:bg-[#F2F9FE]'
            }`}
          >
            30 Hari
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer ${
              period === 'month' ? 'bg-[#2196F3] text-white font-semibold' : 'text-[#4A5565] hover:bg-[#F2F9FE]'
            }`}
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD OWNER */}
      {/* ========================================================================= */}
      {profile.role === 'owner' && (
        <>
          {/* KPI Cards (6) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Pendapatan</span>
                <DollarSign className="w-4 h-4 text-[#2196F3]" />
              </div>
              <p className="text-lg font-bold text-[#212121] tracking-tight tabular-nums">
                {formatRupiah(kpi.pendapatan || 0)}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Periode ini</span>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Laba Kotor</span>
                <TrendingUp className="w-4 h-4 text-[#2E7D32]" />
              </div>
              <p className="text-lg font-bold text-[#2E7D32] tracking-tight tabular-nums">
                {formatRupiah(kpi.laba_kotor || 0)}
              </p>
              <span className="text-[10px] text-[#757575]">Modal part: {formatCompactRupiah(kpi.modal || 0)}</span>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Margin %</span>
                <Percent className="w-4 h-4 text-[#1976D2]" />
              </div>
              <p className="text-lg font-bold text-[#1976D2] tracking-tight tabular-nums">
                {kpi.margin_persen || 0}%
              </p>
              <span className="text-[10px] text-[#757575]">Dari pendapatan</span>
            </Card>

            <Card className="p-4 cursor-pointer hover:border-blue-300 transition-colors" onClick={() => router.push('/work-orders')}>
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">WO Aktif</span>
                <Wrench className="w-4 h-4 text-[#2196F3]" />
              </div>
              <p className="text-lg font-bold text-[#212121] tracking-tight tabular-nums">
                {kpi.wo_aktif || 0}
              </p>
              <span className="text-[10px] text-[#1976D2] font-medium">Lihat daftar &rarr;</span>
            </Card>

            <Card className="p-4 cursor-pointer hover:border-rose-300 transition-colors" onClick={() => router.push('/work-orders')}>
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">WO Terlambat</span>
                <Clock className="w-4 h-4 text-[#E53935]" />
              </div>
              <p className="text-lg font-bold text-[#E53935] tracking-tight tabular-nums">
                {kpi.wo_terlambat || 0}
              </p>
              <span className="text-[10px] text-rose-600 font-medium">Lewat estimasi</span>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Piutang</span>
                <CreditCard className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <p className="text-lg font-bold text-[#F59E0B] tracking-tight tabular-nums">
                {formatRupiah(kpi.piutang || 0)}
              </p>
              <span className="text-[10px] text-[#757575]">Belum terbayar</span>
            </Card>
          </div>

          {/* Charts Row: Pendapatan & Laba Harian + WO per Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Pendapatan Harian (Jasa & Spare Part)</CardTitle>
                <span className="text-xs text-[#757575]">Rincian komposisi pendapatan</span>
              </CardHeader>
              <div className="h-72 w-full">
                {revenueDaily.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueDaily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="tanggal" tickFormatter={(v) => formatDate(v).slice(0, 6)} fontSize={11} stroke="#757575" />
                      <YAxis tickFormatter={(v) => formatCompactRupiah(v)} fontSize={11} stroke="#757575" />
                      <Tooltip formatter={(v: any) => formatRupiah(Number(v))} labelFormatter={(v) => formatDate(v as string)} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="pendapatan_part" name="Spare Part" fill="#2196F3" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="pendapatan_jasa" name="Jasa" fill="#7E57C2" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#757575]">
                    Belum ada invoice di periode ini
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WO per Status</CardTitle>
                <span className="text-xs text-[#757575]">Klik untuk menyaring</span>
              </CardHeader>
              <div className="space-y-2 mt-2">
                {woStatusData.map((st) => {
                  const conf = STATUS_WO_CONFIG[st.status as WOStatus]
                  return (
                    <div
                      key={st.status}
                      onClick={() => router.push(`/work-orders?status=${st.status}`)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F2F9FE] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: conf?.color || '#9E9E9E' }} />
                        <span className="text-xs font-medium text-[#212121]">{conf?.label || st.status}</span>
                      </div>
                      <span className="text-xs font-bold text-[#4A5565] px-2 py-0.5 rounded-full bg-slate-100">
                        {st.jumlah}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Row 3: Beban Mekanik + Top 5 Items + Audit Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Beban Mekanik</CardTitle>
                <span className="text-xs text-[#757575]">WO aktif & selesai</span>
              </CardHeader>
              <div className="h-64">
                {mechanicLoad.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mechanicLoad} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <XAxis type="number" fontSize={11} stroke="#757575" />
                      <YAxis dataKey="mekanik" type="category" width={60} fontSize={11} stroke="#757575" />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="wo_aktif" name="Aktif" fill="#2196F3" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="wo_selesai" name="Selesai" fill="#2E7D32" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#757575]">
                    Belum ada data beban mekanik
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Spare Part & Jasa</CardTitle>
                <span className="text-xs text-[#757575]">Terbanyak terjual</span>
              </CardHeader>
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-[#757575] uppercase tracking-wider">Spare Part Terlaris:</p>
                {topParts.length > 0 ? (
                  topParts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#212121] truncate max-w-[150px]">{item.nama}</span>
                      <span className="text-[#4A5565] font-semibold">{item.jumlah} pcs &middot; {formatCompactRupiah(item.pendapatan)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#757575]">Belum ada penjualan part</p>
                )}

                <div className="pt-2 border-t border-[#EAF2FA]">
                  <p className="text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2">Jasa Terpopuler:</p>
                  {topServices.length > 0 ? (
                    topServices.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#212121] truncate max-w-[150px]">{item.nama}</span>
                        <span className="text-[#4A5565] font-semibold">{item.jumlah}x &middot; {formatCompactRupiah(item.pendapatan)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#757575]">Belum ada servis jasa</p>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Audit Terbaru</CardTitle>
                <Link href="/audit-log" className="text-xs text-[#1976D2] font-medium hover:underline">
                  Semua &rarr;
                </Link>
              </CardHeader>
              <div className="space-y-3 overflow-y-auto max-h-64">
                {recentAudits.length > 0 ? (
                  recentAudits.map((a) => (
                    <div key={a.id} className="text-xs border-b border-[#EAF2FA] pb-2 last:border-none">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#212121]">{a.aksi} &middot; {a.tabel}</span>
                        <span className="text-[10px] text-[#757575]">{formatDateTime(a.waktu).slice(0, 12)}</span>
                      </div>
                      <p className="text-[#4A5565] text-[11px] mt-0.5 truncate">
                        ID: {a.data_id || '-'} {a.alasan ? `(${a.alasan})` : ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#757575]">Belum ada catatan audit</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. DASHBOARD ADMIN */}
      {/* ========================================================================= */}
      {profile.role === 'admin' && (
        <>
          {/* Quick Actions Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[12px] bg-white border border-[#EAF2FA]">
            <form onSubmit={handleSearchPlat} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#757575]" />
                <input
                  type="text"
                  placeholder="Cari Plat Nomor (contoh B 1234 ABC)"
                  value={searchPlat}
                  onChange={(e) => setSearchPlat(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F2F9FE] border border-[#EAF2FA] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
                />
              </div>
              <Button type="submit" size="sm">Cari</Button>
            </form>

            <Link href="/work-orders/baru">
              <Button className="w-full sm:w-auto gap-2">
                <Plus className="w-4 h-4" />
                <span>+ Work Order Baru</span>
              </Button>
            </Link>
          </div>

          {/* KPI Cards (4) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Mobil Masuk Hari Ini</span>
                <Car className="w-4 h-4 text-[#2196F3]" />
              </div>
              <p className="text-2xl font-bold text-[#212121] tabular-nums">{kpi.mobil_masuk_hari_ini || 0}</p>
              <span className="text-[10px] text-[#757575]">Work Order baru</span>
            </Card>

            <Card className="p-4 cursor-pointer hover:border-emerald-300" onClick={() => router.push('/work-orders?status=siap_diambil')}>
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Siap Diambil</span>
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
              </div>
              <p className="text-2xl font-bold text-[#2E7D32] tabular-nums">{kpi.siap_diambil || 0}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Lulus QC pengerjaan</span>
            </Card>

            <Card className="p-4 cursor-pointer hover:border-amber-300" onClick={() => router.push('/work-orders?status=siap_diambil')}>
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Perlu Ditagih</span>
                <CreditCard className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <p className="text-2xl font-bold text-[#F59E0B] tabular-nums">{kpi.perlu_ditagih || 0}</p>
              <span className="text-[10px] text-amber-700 font-medium">Invoice belum lunas</span>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Pendapatan Hari Ini</span>
                <DollarSign className="w-4 h-4 text-[#2196F3]" />
              </div>
              <p className="text-xl font-bold text-[#212121] tabular-nums">{formatRupiah(kpi.pendapatan_hari_ini || 0)}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Pembayaran diterima</span>
            </Card>
          </div>

          {/* Action Lists: Perlu Ditagih & Siap Diserahkan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mobil Perlu Ditagih (Siap Diambil)</CardTitle>
                <Link href="/work-orders?status=siap_diambil" className="text-xs text-[#1976D2] font-medium hover:underline">
                  Lihat Semua &rarr;
                </Link>
              </CardHeader>
              <div className="space-y-2">
                {attentionWos.length > 0 ? (
                  attentionWos.map((wo) => (
                    <div
                      key={wo.id}
                      onClick={() => router.push(`/work-orders/${wo.id}/tagihan`)}
                      className="p-3 rounded-lg border border-[#EAF2FA] hover:bg-[#F2F9FE] cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#212121]">{wo.nomor}</span>
                          <span className="font-semibold text-xs text-[#1976D2]">{wo.vehicles?.plat}</span>
                        </div>
                        <p className="text-[11px] text-[#757575]">{wo.customers?.nama}</p>
                      </div>
                      <div className="text-right">
                        <Button size="sm" variant="secondary">Buka Tagihan</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#757575] py-4 text-center">Tidak ada mobil yang menunggu penagihan</p>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mobil Siap Diserahkan (Lunas)</CardTitle>
                <span className="text-xs text-[#757575]">Tinggal upload foto akhir</span>
              </CardHeader>
              <div className="space-y-2">
                {readyDeliverWos.length > 0 ? (
                  readyDeliverWos.map((wo) => (
                    <div
                      key={wo.id}
                      onClick={() => router.push(`/work-orders/${wo.id}/tagihan`)}
                      className="p-3 rounded-lg border border-[#EAF2FA] hover:bg-[#F2F9FE] cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#212121]">{wo.nomor}</span>
                          <span className="font-semibold text-xs text-[#2E7D32]">{wo.vehicles?.plat}</span>
                        </div>
                        <p className="text-[11px] text-[#757575]">{wo.customers?.nama}</p>
                      </div>
                      <Button size="sm" variant="success">Serahkan Mobil</Button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#757575] py-4 text-center">Belum ada mobil lunas yang menunggu penyerahan</p>
                )}
              </div>
            </Card>
          </div>

          {/* Row 3: Pendapatan 7 Hari & Stok Menipis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Pendapatan 7 Hari Terakhir</CardTitle>
              </CardHeader>
              <div className="h-60 w-full">
                {revenueDaily.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueDaily}>
                      <XAxis dataKey="tanggal" tickFormatter={(v) => formatDate(v).slice(0, 6)} fontSize={11} stroke="#757575" />
                      <YAxis tickFormatter={(v) => formatCompactRupiah(v)} fontSize={11} stroke="#757575" />
                      <Tooltip formatter={(v: any) => formatRupiah(Number(v))} labelFormatter={(v) => formatDate(v as string)} />
                      <Bar dataKey="pendapatan_part" name="Part" fill="#2196F3" stackId="a" />
                      <Bar dataKey="pendapatan_jasa" name="Jasa" fill="#7E57C2" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#757575]">
                    Belum ada invoice dalam 7 hari
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stok Spare Part Menipis</CardTitle>
                <Link href="/inventory" className="text-xs text-[#1976D2] font-medium hover:underline">
                  Inventory &rarr;
                </Link>
              </CardHeader>
              <div className="space-y-3">
                {lowStocks.length > 0 ? (
                  lowStocks.map((item) => (
                    <div key={item.id} className="p-2 rounded-lg bg-amber-50/50 border border-amber-200">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#212121]">
                        <span>{item.nama}</span>
                        <span className="text-[#E53935]">Sisa: {item.stok}</span>
                      </div>
                      <p className="text-[10px] text-[#757575]">Batas minimum: {item.stok_minimum} pcs</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#2E7D32] flex items-center gap-1.5 py-4">
                    <CheckCircle2 className="w-4 h-4" /> Stok spare part aman
                  </p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. DASHBOARD KEPALA MEKANIK */}
      {/* ========================================================================= */}
      {profile.role === 'kepala_mekanik' && (
        <>
          {/* KPI Cards (4) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 cursor-pointer hover:border-slate-300" onClick={() => router.push('/work-orders?status=menunggu')}>
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Menunggu Ditugaskan</span>
                <Clock className="w-4 h-4 text-[#9E9E9E]" />
              </div>
              <p className="text-2xl font-bold text-[#212121] tabular-nums">{kpi.menunggu_ditugaskan || 0}</p>
              <span className="text-[10px] text-[#1976D2] font-medium">Perlu tunjuk mekanik &rarr;</span>
            </Card>

            <Card className="p-4 cursor-pointer hover:border-blue-300" onClick={() => router.push('/work-orders?status=dikerjakan')}>
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Sedang Dikerjakan</span>
                <Wrench className="w-4 h-4 text-[#2196F3]" />
              </div>
              <p className="text-2xl font-bold text-[#2196F3] tabular-nums">{kpi.sedang_dikerjakan || 0}</p>
              <span className="text-[10px] text-[#757575]">Dalam proses servis</span>
            </Card>

            <Card className="p-4 cursor-pointer hover:border-purple-300" onClick={() => router.push('/work-orders?status=selesai')}>
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Menunggu QC</span>
                <ShieldAlert className="w-4 h-4 text-[#7E57C2]" />
              </div>
              <p className="text-2xl font-bold text-[#7E57C2] tabular-nums">{kpi.menunggu_qc || 0}</p>
              <span className="text-[10px] text-purple-700 font-medium">Periksa hasil kerja (QC)</span>
            </Card>

            <Card className="p-4 cursor-pointer hover:border-rose-300" onClick={() => router.push('/work-orders')}>
              <div className="flex items-center justify-between text-[#757575] mb-2">
                <span className="text-xs font-medium">Terlambat</span>
                <AlertTriangle className="w-4 h-4 text-[#E53935]" />
              </div>
              <p className="text-2xl font-bold text-[#E53935] tabular-nums">{kpi.terlambat || 0}</p>
              <span className="text-[10px] text-rose-600 font-medium">Lewat estimasi selesai</span>
            </Card>
          </div>

          {/* Antrean Tim Pengerjaan */}
          <Card>
            <CardHeader>
              <CardTitle>Antrean Pengerjaan Tim Saya</CardTitle>
              <Link href="/work-orders" className="text-xs text-[#1976D2] font-medium hover:underline">
                Buka Semua Work Order &rarr;
              </Link>
            </CardHeader>
            <div className="divide-y divide-[#EAF2FA]">
              {teamQueue.length > 0 ? (
                teamQueue.map((wo) => {
                  const conf = STATUS_WO_CONFIG[wo.status as WOStatus]
                  const isLate =
                    wo.estimasi_selesai &&
                    new Date(wo.estimasi_selesai) < new Date() &&
                    !['selesai', 'siap_diambil', 'diambil', 'dibatalkan'].includes(wo.status)

                  return (
                    <div
                      key={wo.id}
                      onClick={() => router.push(`/work-orders/${wo.id}`)}
                      className="py-3 flex items-center justify-between hover:bg-[#F2F9FE] px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#212121]">{wo.nomor}</span>
                          <span className="text-xs font-semibold text-[#1976D2]">{wo.vehicles?.plat}</span>
                          <span className="text-xs text-[#757575]">&middot; {wo.vehicles?.merek_model}</span>
                          {isLate && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                              Terlambat
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4A5565] truncate max-w-lg">Keluhan: {wo.keluhan}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${conf.badgeClass}`}>
                          {conf.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#757575]" />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-[#757575] py-6 text-center">Tidak ada antrean pengerjaan aktif di tim Anda</p>
              )}
            </div>
          </Card>

          {/* Row 3: Beban Mekanik Tim & Grafik WO Selesai Harian */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Beban Kerja Mekanik di Tim Anda</CardTitle>
              </CardHeader>
              <div className="h-64">
                {mechanicLoad.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mechanicLoad} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="mekanik" fontSize={11} stroke="#757575" />
                      <YAxis fontSize={11} stroke="#757575" />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="wo_aktif" name="WO Aktif" fill="#2196F3" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="wo_selesai" name="WO Selesai" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#757575]">
                    Belum ada data mekanik
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tren WO Selesai Harian</CardTitle>
              </CardHeader>
              <div className="h-64">
                {woFinishedDaily.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={woFinishedDaily}>
                      <XAxis dataKey="tanggal" tickFormatter={(v) => formatDate(v).slice(0, 6)} fontSize={11} stroke="#757575" />
                      <YAxis fontSize={11} stroke="#757575" />
                      <Tooltip labelFormatter={(v) => formatDate(v as string)} />
                      <Line type="monotone" dataKey="jumlah" name="Selesai" stroke="#2E7D32" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#757575]">
                    Belum ada WO selesai di rentang ini
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
