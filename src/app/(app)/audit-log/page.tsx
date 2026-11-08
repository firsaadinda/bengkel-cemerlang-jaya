'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { History, Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuditLog, Profile } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils'

export default function AuditLogPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filterAction, setFilterAction] = useState('')
  const [filterTable, setFilterTable] = useState('')
  const pageSize = 30

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  async function fetchLogs() {
    setIsLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('waktu', { ascending: false })

      if (filterAction) {
        query = query.eq('aksi', filterAction)
      }
      if (filterTable) {
        query = query.eq('tabel', filterTable)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, count } = await query
      if (data) {
        setLogs(data as AuditLog[])
        setTotalCount(count || 0)
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.role === 'owner') {
      fetchLogs()
    }
  }, [profile, filterAction, filterTable, page])

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#212121]">Audit Log Sistem</h1>
        <p className="text-xs text-[#757575] mt-0.5">
          Catatan riwayat perubahan data, transaksi harga, stok, dan perubahan status (Khusus Owner)
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value)
              setPage(1)
            }}
            className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121]"
          >
            <option value="">Semua Jenis Aksi (INSERT / UPDATE / DELETE)</option>
            <option value="INSERT">INSERT (Tambah Data)</option>
            <option value="UPDATE">UPDATE (Ubah Data)</option>
            <option value="DELETE">DELETE (Hapus Data)</option>
          </select>
        </div>

        <div>
          <select
            value={filterTable}
            onChange={(e) => {
              setFilterTable(e.target.value)
              setPage(1)
            }}
            className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121]"
          >
            <option value="">Semua Tabel Sumber</option>
            <option value="work_orders">Work Order (work_orders)</option>
            <option value="billing_items">Tagihan (billing_items)</option>
            <option value="inventory_items">Inventory (inventory_items)</option>
            <option value="invoices">Invoice (invoices)</option>
            <option value="payments">Pembayaran (payments)</option>
            <option value="profiles">Profil Pengguna (profiles)</option>
          </select>
        </div>
      </div>

      {/* Main Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F9FE] text-[#757575] font-semibold border-b border-[#EAF2FA]">
              <tr>
                <th className="px-5 py-3.5">Waktu</th>
                <th className="px-4 py-3.5">Peran Pelaku</th>
                <th className="px-4 py-3.5">Aksi</th>
                <th className="px-4 py-3.5">Tabel</th>
                <th className="px-4 py-3.5">Nomor / Data ID</th>
                <th className="px-4 py-3.5">Alasan / Catatan</th>
                <th className="px-5 py-3.5 text-right">Rincian JSON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2FA]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#757575]">
                    Memuat catatan audit log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#757575]">
                    Tidak ada catatan audit ditemukan.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 text-[#757575] whitespace-nowrap">
                      {formatDateTime(log.waktu)}
                    </td>
                    <td className="px-4 py-3.5 font-bold capitalize text-[#1976D2]">
                      {log.pelaku_peran || 'System'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.aksi === 'INSERT'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.aksi === 'UPDATE'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {log.aksi}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#212121]">{log.tabel}</td>
                    <td className="px-4 py-3.5 font-bold text-[#4A5565]">{log.data_id || '-'}</td>
                    <td className="px-4 py-3.5 text-[#757575] max-w-xs truncate">{log.alasan || '-'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedLog(log)}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> JSON
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-[#EAF2FA] flex items-center justify-between text-xs text-[#757575]">
          <span>
            Menampilkan {logs.length} dari {totalCount} log
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#EAF2FA] hover:bg-[#F2F9FE] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-[#212121]">
              Halaman {page} dari {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-[#EAF2FA] hover:bg-[#F2F9FE] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Modal Detail JSON Audit */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Log #${selectedLog?.id}`}
        description={`Tabel ${selectedLog?.tabel} - Aksi ${selectedLog?.aksi} (${formatDateTime(selectedLog?.waktu)})`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {selectedLog?.sebelum && (
            <div>
              <p className="font-bold text-[#757575] uppercase text-[10px] mb-1">Kondisi Sebelum:</p>
              <pre className="p-3 bg-slate-50 border border-[#EAF2FA] rounded-lg overflow-x-auto text-[11px] font-mono">
                {JSON.stringify(selectedLog.sebelum, null, 2)}
              </pre>
            </div>
          )}

          {selectedLog?.sesudah && (
            <div>
              <p className="font-bold text-[#1976D2] uppercase text-[10px] mb-1">Kondisi Sesudah:</p>
              <pre className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg overflow-x-auto text-[11px] font-mono">
                {JSON.stringify(selectedLog.sesudah, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setSelectedLog(null)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
