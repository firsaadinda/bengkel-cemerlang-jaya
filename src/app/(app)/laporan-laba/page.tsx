'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, DollarSign, Percent, Calendar, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { formatRupiah, formatDate } from '@/lib/utils'

export default function LaporanLabaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [period, setPeriod] = useState<'month' | '30days' | 'year'>('month')
  const [reportData, setReportData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getDateRange = () => {
    const now = new Date()
    const end = now.toISOString()
    let start = new Date()

    if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (period === '30days') {
      start.setDate(now.getDate() - 30)
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1)
    }

    return { start: start.toISOString(), end }
  }

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
        if (prof.role !== 'owner') {
          router.push('/dashboard')
          return
        }
        setProfile(prof as Profile)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (!profile || profile.role !== 'owner') return

    async function fetchReport() {
      setIsLoading(true)
      const { start, end } = getDateRange()
      try {
        const { data, error } = await supabase.rpc('laporan_laba', {
          p_dari: start,
          p_sampai: end,
        })
        if (data) setReportData(data)
      } catch (err) {
        console.error('Error fetching laba report:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [profile, period])

  const totalPendapatan = reportData.reduce((acc, curr) => acc + Number(curr.pendapatan || 0), 0)
  const totalModal = reportData.reduce((acc, curr) => acc + Number(curr.modal || 0), 0)
  const totalLaba = totalPendapatan - totalModal
  const avgMargin = totalPendapatan > 0 ? ((totalLaba / totalPendapatan) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#212121]">Laporan Laba Rugi Bengkel</h1>
          <p className="text-xs text-[#757575] mt-0.5">
            Analisis laba kotor per Work Order dan per periode (Khusus Owner)
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-[#EAF2FA] rounded-[10px] text-xs font-medium">
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer ${
              period === 'month' ? 'bg-[#2196F3] text-white font-semibold' : 'text-[#4A5565] hover:bg-[#F2F9FE]'
            }`}
          >
            Bulan Ini
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
            onClick={() => setPeriod('year')}
            className={`px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer ${
              period === 'year' ? 'bg-[#2196F3] text-white font-semibold' : 'text-[#4A5565] hover:bg-[#F2F9FE]'
            }`}
          >
            Tahun Ini
          </button>
        </div>
      </div>

      {/* KPI Cards (4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-[#757575] font-medium block mb-1">Total Pendapatan</span>
          <p className="text-xl font-bold text-[#212121] tabular-nums">{formatRupiah(totalPendapatan)}</p>
          <span className="text-[10px] text-[#1976D2]">Dari seluruh invoice selesai</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-[#757575] font-medium block mb-1">Modal Spare Part</span>
          <p className="text-xl font-bold text-[#757575] tabular-nums">{formatRupiah(totalModal)}</p>
          <span className="text-[10px] text-[#757575]">Harga modal part terpakai</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-[#757575] font-medium block mb-1">Laba Kotor</span>
          <p className="text-xl font-bold text-[#2E7D32] tabular-nums">{formatRupiah(totalLaba)}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Pendapatan - Modal Part</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-[#757575] font-medium block mb-1">Margin Kotor</span>
          <p className="text-xl font-bold text-[#1976D2] tabular-nums">{avgMargin}%</p>
          <span className="text-[10px] text-[#757575]">Rasio profitabilitas</span>
        </Card>
      </div>

      {/* Tabel Rincian per WO */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F9FE] text-[#757575] font-semibold border-b border-[#EAF2FA]">
              <tr>
                <th className="px-5 py-3.5">No WO</th>
                <th className="px-4 py-3.5">No Invoice</th>
                <th className="px-4 py-3.5">Tanggal Invoice</th>
                <th className="px-4 py-3.5">Plat Mobil</th>
                <th className="px-4 py-3.5">Pendapatan</th>
                <th className="px-4 py-3.5">Modal Part</th>
                <th className="px-4 py-3.5">Laba Kotor</th>
                <th className="px-4 py-3.5">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2FA]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[#757575]">
                    Menghitung laporan laba di database...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[#757575]">
                    Belum ada invoice di rentang tanggal ini.
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => {
                  const isNegative = Number(row.laba) < 0
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-[#212121]">{row.nomor_wo}</td>
                      <td className="px-4 py-3.5 text-[#1976D2] font-semibold">{row.nomor_invoice}</td>
                      <td className="px-4 py-3.5 text-[#757575]">{formatDate(row.tanggal_invoice)}</td>
                      <td className="px-4 py-3.5 font-semibold text-[#212121]">{row.plat}</td>
                      <td className="px-4 py-3.5 font-medium tabular-nums">{formatRupiah(row.pendapatan)}</td>
                      <td className="px-4 py-3.5 text-[#757575] tabular-nums">{formatRupiah(row.modal)}</td>
                      <td
                        className={`px-4 py-3.5 font-bold tabular-nums ${
                          isNegative ? 'text-[#E53935]' : 'text-[#2E7D32]'
                        }`}
                      >
                        {formatRupiah(row.laba)}
                      </td>
                      <td
                        className={`px-4 py-3.5 font-semibold tabular-nums ${
                          isNegative ? 'text-[#E53935]' : 'text-[#212121]'
                        }`}
                      >
                        {row.margin_persen}%
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
