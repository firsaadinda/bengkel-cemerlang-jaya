'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Plus, Search, ChevronLeft, ChevronRight, Eye, Phone, Car } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Customer, Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

export default function PelangganPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  const [isAddModal, setIsAddModal] = useState(false)
  const [custTipe, setCustTipe] = useState<'perorangan' | 'perusahaan'>('perorangan')
  const [custNama, setCustNama] = useState('')
  const [custTelepon, setCustTelepon] = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [custAlamat, setCustAlamat] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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
      if (prof) setProfile(prof as Profile)
    }
    loadUser()
  }, [])

  async function fetchCustomers() {
    setIsLoading(true)
    try {
      let query = supabase
        .from('customers')
        .select(
          `
          *,
          vehicles(id, plat),
          work_orders(id, created_at)
        `,
          { count: 'exact' }
        )
        .order('nama', { ascending: true })

      if (searchTerm.trim()) {
        query = query.or(`nama.ilike.%${searchTerm.trim()}%,telepon.ilike.%${searchTerm.trim()}%`)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, count } = await query
      if (data) {
        setCustomers(data)
        setTotalCount(count || 0)
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm, page])

  const canEdit = profile && profile.role !== 'kepala_mekanik'

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!/^[0-9]{10,14}$/.test(custTelepon.trim())) {
      setErrorMsg('Nomor telepon harus berupa 10 sampai 14 digit angka')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from('customers').insert({
        tipe: custTipe,
        nama: custNama.trim(),
        telepon: custTelepon.trim(),
        email: custEmail.trim() || null,
        alamat: custAlamat.trim() || null,
      })

      if (error) {
        if (error.code === '23505') {
          setErrorMsg('Nomor telepon sudah terdaftar untuk pelanggan lain')
        } else {
          setErrorMsg(error.message)
        }
        setIsSaving(false)
        return
      }

      setIsAddModal(false)
      setCustNama('')
      setCustTelepon('')
      setCustEmail('')
      setCustAlamat('')
      fetchCustomers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pelanggan')
    } finally {
      setIsSaving(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#212121]">Data Pelanggan</h1>
          <p className="text-xs text-[#757575] mt-0.5">
            Daftar pelanggan bengkel, kepemilikan armada mobil, dan riwayat servis
          </p>
        </div>

        {canEdit && (
          <Button onClick={() => setIsAddModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>+ Pelanggan Baru</span>
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#757575]" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama atau nomor telepon..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
        />
      </div>

      {/* Customers Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F9FE] text-[#757575] font-semibold border-b border-[#EAF2FA]">
              <tr>
                <th className="px-5 py-3.5">Nama Pelanggan</th>
                <th className="px-4 py-3.5">Tipe</th>
                <th className="px-4 py-3.5">Nomor Telepon</th>
                <th className="px-4 py-3.5">Jumlah Kendaraan</th>
                <th className="px-4 py-3.5">Servis Terakhir</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2FA]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#757575]">
                    Memuat data pelanggan...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#757575]">
                    Tidak ada pelanggan yang ditemukan.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const lastWo = c.work_orders?.sort(
                    (a: any, b: any) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )[0]

                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/pelanggan/${c.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-[#212121]">{c.nama}</td>
                      <td className="px-4 py-3.5">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-semibold text-[#4A5565]">
                          {c.tipe}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#4A5565]">{c.telepon}</td>
                      <td className="px-4 py-3.5 font-semibold text-[#1976D2]">
                        {c.vehicles?.length || 0} Mobil
                      </td>
                      <td className="px-4 py-3.5 text-[#757575]">
                        {lastWo ? formatDate(lastWo.created_at) : 'Belum ada servis'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/pelanggan/${c.id}`)
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
            Menampilkan {customers.length} dari {totalCount} pelanggan
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

      {/* Modal Tambah Pelanggan */}
      <Modal
        isOpen={isAddModal}
        onClose={() => setIsAddModal(false)}
        title="Tambah Pelanggan Baru"
        description="Pendaftaran data pemilik kendaraan di sistem bengkel."
      >
        <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">{errorMsg}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-1">Tipe Pelanggan</label>
            <select
              value={custTipe}
              onChange={(e) => setCustTipe(e.target.value as any)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
            >
              <option value="perorangan">Perorangan</option>
              <option value="perusahaan">Perusahaan</option>
            </select>
          </div>

          <Input
            label="Nama Pelanggan *"
            placeholder="Nama lengkap"
            value={custNama}
            onChange={(e) => setCustNama(e.target.value)}
            required
          />

          <Input
            label="Nomor Telepon/WhatsApp * (10-14 digit)"
            placeholder="Contoh: 081234567890"
            value={custTelepon}
            onChange={(e) => setCustTelepon(e.target.value)}
            required
          />

          <Input
            label="Email (Opsional)"
            type="email"
            placeholder="email@example.com"
            value={custEmail}
            onChange={(e) => setCustEmail(e.target.value)}
          />

          <Input
            label="Alamat (Opsional)"
            placeholder="Alamat tempat tinggal / kantor"
            value={custAlamat}
            onChange={(e) => setCustAlamat(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Simpan Pelanggan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

