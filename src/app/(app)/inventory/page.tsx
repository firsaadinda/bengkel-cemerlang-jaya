'use client'

import React, { useState, useEffect } from 'react'
import {
  Package,
  Wrench,
  History,
  Plus,
  Search,
  ArrowDownLeft,
  SlidersHorizontal,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { InventoryItem, Profile, StockMovement } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatRupiah, formatDate, formatDateTime } from '@/lib/utils'

export default function InventoryPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<'part' | 'jasa' | 'riwayat'>('part')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  const [items, setItems] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal: Tambah Spare Part
  const [isAddPartModal, setIsAddPartModal] = useState(false)
  const [partNama, setPartNama] = useState('')
  const [partHargaJual, setPartHargaJual] = useState<number | ''>('')
  const [partHargaModal, setPartHargaModal] = useState<number | ''>('')
  const [partStokMin, setPartStokMin] = useState<number>(5)

  // Modal: Tambah Jasa
  const [isAddJasaModal, setIsAddJasaModal] = useState(false)
  const [jasaNama, setJasaNama] = useState('')
  const [jasaTarif, setJasaTarif] = useState<number | ''>('')

  // Modal: Stok Masuk
  const [isStokMasukModal, setIsStokMasukModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [masukQty, setMasukQty] = useState<number>(1)
  const [masukKet, setMasukKet] = useState('')

  // Modal: Sesuaikan Stok (Owner)
  const [isAdjustStokModal, setIsAdjustStokModal] = useState(false)
  const [fisikQty, setFisikQty] = useState<number>(0)
  const [adjustReason, setAdjustReason] = useState('')

  // Modal: Edit Item / Harga (Owner)
  const [isEditItemModal, setIsEditItemModal] = useState(false)
  const [editNama, setEditNama] = useState('')
  const [editJual, setEditJual] = useState<number>(0)
  const [editModal, setEditModal] = useState<number>(0)

  const [actionLoading, setActionLoading] = useState(false)
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

  async function fetchData() {
    setIsLoading(true)
    try {
      if (activeTab === 'part' || activeTab === 'jasa') {
        let query = supabase
          .from('inventory_items')
          .select('*, inventory_costs(harga_modal)', { count: 'exact' })
          .eq('jenis', activeTab)
          .eq('aktif', true)
          .order('nama', { ascending: true })

        if (searchTerm.trim()) {
          query = query.or(`nama.ilike.%${searchTerm.trim()}%,kode.ilike.%${searchTerm.trim()}%`)
        }

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        const { data, count } = await query
        if (data) {
          setItems(data)
          setTotalCount(count || 0)
        }
      } else {
        // Riwayat Stok
        let query = supabase
          .from('stock_movements')
          .select(
            `
            *,
            inventory_items(nama, kode),
            profiles(nama)
          `,
            { count: 'exact' }
          )
          .order('created_at', { ascending: false })

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        const { data, count } = await query
        if (data) {
          setMovements(data)
          setTotalCount(count || 0)
        }
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, searchTerm, page])

  const isOwner = profile?.role === 'owner'
  const canAdd = profile?.role === 'owner' || profile?.role === 'admin'

  // Simpan Spare Part Baru
  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!partNama.trim() || partHargaJual === '') return

    setActionLoading(true)
    try {
      const { data: newItem, error: itemErr } = await supabase
        .from('inventory_items')
        .insert({
          jenis: 'part',
          nama: partNama.trim(),
          harga_jual: Number(partHargaJual),
          stok: 0,
          stok_minimum: partStokMin,
          aktif: true,
        })
        .select()
        .single()

      if (itemErr) throw itemErr

      // Jika Owner, masukkan juga harga modal
      if (isOwner && partHargaModal !== '') {
        await supabase.from('inventory_costs').insert({
          item_id: newItem.id,
          harga_modal: Number(partHargaModal),
        })
      }

      setIsAddPartModal(false)
      setPartNama('')
      setPartHargaJual('')
      setPartHargaModal('')
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan spare part')
    } finally {
      setActionLoading(false)
    }
  }

  // Simpan Jasa Baru
  const handleAddJasa = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!jasaNama.trim() || jasaTarif === '') return

    setActionLoading(true)
    try {
      const { error } = await supabase.from('inventory_items').insert({
        jenis: 'jasa',
        nama: jasaNama.trim(),
        harga_jual: Number(jasaTarif),
        stok: 0,
        aktif: true,
      })

      if (error) throw error

      setIsAddJasaModal(false)
      setJasaNama('')
      setJasaTarif('')
      fetchData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan jasa')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Stok Masuk
  const handleStokMasuk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || masukQty < 1) return

    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('catat_stok_masuk', {
        p_item: selectedItem.id,
        p_jumlah: masukQty,
        p_keterangan: masukKet.trim() || 'Penerimaan stok spare part',
      })
      if (error) throw error

      setIsStokMasukModal(false)
      setMasukQty(1)
      setMasukKet('')
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat stok masuk')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Penyesuaian Stok (Owner)
  const handleAdjustStok = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !adjustReason.trim()) {
      alert('Alasan penyesuaian stok wajib diisi')
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('sesuaikan_stok', {
        p_item: selectedItem.id,
        p_stok_fisik: fisikQty,
        p_alasan: adjustReason.trim(),
      })
      if (error) throw error

      setIsAdjustStokModal(false)
      setAdjustReason('')
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Gagal menyesuaikan stok')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Edit Item / Harga (Owner)
  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    setActionLoading(true)
    try {
      const { error: itemErr } = await supabase
        .from('inventory_items')
        .update({
          nama: editNama.trim(),
          harga_jual: editJual,
        })
        .eq('id', selectedItem.id)

      if (itemErr) throw itemErr

      if (selectedItem.jenis === 'part' && isOwner) {
        const { error: costErr } = await supabase
          .from('inventory_costs')
          .upsert({
            item_id: selectedItem.id,
            harga_modal: editModal,
          })
        if (costErr) throw costErr
      }

      setIsEditItemModal(false)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan')
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#212121]">Inventory Bengkel</h1>
          <p className="text-xs text-[#757575] mt-0.5">
            Katalog spare part, tarif jasa servis, dan mutasi pergerakan stok
          </p>
        </div>

        {canAdd && (
          <div className="flex items-center gap-2">
            {activeTab === 'part' && (
              <Button onClick={() => setIsAddPartModal(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                <span>+ Spare Part Baru</span>
              </Button>
            )}
            {activeTab === 'jasa' && (
              <Button onClick={() => setIsAddJasaModal(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                <span>+ Jasa Servis Baru</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-[#EAF2FA] text-xs font-semibold">
        <button
          onClick={() => {
            setActiveTab('part')
            setPage(1)
          }}
          className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'part' ? 'border-[#2196F3] text-[#1976D2]' : 'border-transparent text-[#757575] hover:text-[#212121]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Spare Part</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('jasa')
            setPage(1)
          }}
          className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'jasa' ? 'border-[#2196F3] text-[#1976D2]' : 'border-transparent text-[#757575] hover:text-[#212121]'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Jasa Servis</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('riwayat')
            setPage(1)
          }}
          className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'riwayat' ? 'border-[#2196F3] text-[#1976D2]' : 'border-transparent text-[#757575] hover:text-[#212121]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Pergerakan Stok</span>
        </button>
      </div>

      {/* Search Bar */}
      {activeTab !== 'riwayat' && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#757575]" />
          <input
            type="text"
            placeholder={`Cari nama ${activeTab === 'part' ? 'spare part' : 'jasa'} atau kode SKU...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
          />
        </div>
      )}

      {/* Main Table */}
      <Card className="p-0 overflow-hidden">
        {activeTab === 'part' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2F9FE] text-[#757575] font-semibold border-b border-[#EAF2FA]">
                <tr>
                  <th className="px-5 py-3.5">SKU</th>
                  <th className="px-4 py-3.5">Nama Spare Part</th>
                  <th className="px-4 py-3.5">Stok Saat Ini</th>
                  <th className="px-4 py-3.5">Stok Min</th>
                  <th className="px-4 py-3.5">Harga Jual</th>
                  {isOwner && <th className="px-4 py-3.5 text-[#2E7D32]">Harga Modal</th>}
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2FA]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-[#757575]">
                      Memuat data spare part...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-[#757575]">
                      Tidak ada spare part ditemukan.
                    </td>
                  </tr>
                ) : (
                  items.map((i) => {
                    const status = i.stok === 0 ? 'Habis' : i.stok <= i.stok_minimum ? 'Menipis' : 'Aman'
                    const statusBadgeClass =
                      status === 'Habis'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : status === 'Menipis'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'

                    const modal = i.inventory_costs?.harga_modal

                    return (
                      <tr key={i.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-bold text-[#757575]">{i.kode}</td>
                        <td className="px-4 py-3.5 font-semibold text-[#212121]">{i.nama}</td>
                        <td className="px-4 py-3.5 font-bold text-sm text-[#212121] tabular-nums">
                          {i.stok}
                        </td>
                        <td className="px-4 py-3.5 text-[#757575]">{i.stok_minimum}</td>
                        <td className="px-4 py-3.5 font-semibold text-[#212121] tabular-nums">
                          {formatRupiah(i.harga_jual)}
                        </td>
                        {isOwner && (
                          <td className="px-4 py-3.5 text-[#2E7D32] font-semibold tabular-nums">
                            {modal !== undefined && modal !== null ? formatRupiah(modal) : (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                Belum diisi
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          {canAdd && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedItem(i)
                                setMasukQty(1)
                                setMasukKet('')
                                setIsStokMasukModal(true)
                              }}
                            >
                              Stok Masuk
                            </Button>
                          )}
                          {isOwner && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItem(i)
                                  setFisikQty(i.stok)
                                  setAdjustReason('')
                                  setIsAdjustStokModal(true)
                                }}
                              >
                                Sesuaikan
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedItem(i)
                                  setEditNama(i.nama)
                                  setEditJual(i.harga_jual)
                                  setEditModal(modal || 0)
                                  setIsEditItemModal(true)
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Jasa */}
        {activeTab === 'jasa' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2F9FE] text-[#757575] font-semibold border-b border-[#EAF2FA]">
                <tr>
                  <th className="px-5 py-3.5">Kode</th>
                  <th className="px-4 py-3.5">Nama Layanan Jasa</th>
                  <th className="px-4 py-3.5">Tarif Servis</th>
                  {isOwner && <th className="px-5 py-3.5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2FA]">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-[#757575]">
                      Memuat daftar jasa servis...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-[#757575]">
                      Tidak ada jasa ditemukan.
                    </td>
                  </tr>
                ) : (
                  items.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-[#757575]">{j.kode}</td>
                      <td className="px-4 py-3.5 font-bold text-[#212121]">{j.nama}</td>
                      <td className="px-4 py-3.5 font-semibold text-[#1976D2] tabular-nums text-sm">
                        {formatRupiah(j.harga_jual)}
                      </td>
                      {isOwner && (
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedItem(j)
                              setEditNama(j.nama)
                              setEditJual(j.harga_jual)
                              setIsEditItemModal(true)
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Ubah Tarif
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Riwayat Stok */}
        {activeTab === 'riwayat' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2F9FE] text-[#757575] font-semibold border-b border-[#EAF2FA]">
                <tr>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-4 py-3.5">Spare Part</th>
                  <th className="px-4 py-3.5">Jenis Mutasi</th>
                  <th className="px-4 py-3.5">Jumlah</th>
                  <th className="px-4 py-3.5">Stok Akhir</th>
                  <th className="px-4 py-3.5">Keterangan</th>
                  <th className="px-4 py-3.5">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2FA]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#757575]">
                      Memuat riwayat stok...
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#757575]">
                      Belum ada pergerakan stok.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 text-[#757575]">{formatDateTime(m.created_at)}</td>
                      <td className="px-4 py-3.5 font-bold text-[#212121]">
                        {m.inventory_items?.nama} ({m.inventory_items?.kode})
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.jenis === 'masuk'
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.jenis === 'keluar'
                              ? 'bg-rose-50 text-rose-700'
                              : m.jenis === 'kembali'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {m.jenis}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold tabular-nums">
                        {m.jumlah > 0 ? `+${m.jumlah}` : m.jumlah}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#212121] tabular-nums">
                        {m.stok_sesudah}
                      </td>
                      <td className="px-4 py-3.5 text-[#4A5565] max-w-xs truncate">{m.keterangan || '-'}</td>
                      <td className="px-4 py-3.5 text-[#757575]">{m.profiles?.nama || 'Sistem'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-[#EAF2FA] flex items-center justify-between text-xs text-[#757575]">
          <span>
            Menampilkan {activeTab === 'riwayat' ? movements.length : items.length} dari {totalCount} data
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

      {/* Modal: Tambah Spare Part */}
      <Modal
        isOpen={isAddPartModal}
        onClose={() => setIsAddPartModal(false)}
        title="Tambah Spare Part Baru"
        description="Item baru akan terdaftar dengan stok awal 0. Gunakan Stok Masuk untuk menambah fisik."
      >
        <form onSubmit={handleAddPart} className="space-y-4 text-xs">
          {errorMsg && <div className="p-3 rounded bg-rose-50 text-rose-700">{errorMsg}</div>}

          <Input
            label="Nama Spare Part *"
            placeholder="Contoh: Oli Mesin 4L"
            value={partNama}
            onChange={(e) => setPartNama(e.target.value)}
            required
          />

          <Input
            label="Harga Jual ke Pelanggan (Rp) *"
            type="number"
            min="0"
            placeholder="Contoh: 450000"
            value={partHargaJual}
            onChange={(e) => setPartHargaJual(e.target.value ? Number(e.target.value) : '')}
            required
          />

          {isOwner && (
            <Input
              label="Harga Modal Rahasia (Rp) *"
              type="number"
              min="0"
              placeholder="Contoh: 360000"
              value={partHargaModal}
              onChange={(e) => setPartHargaModal(e.target.value ? Number(e.target.value) : '')}
              required
            />
          )}

          <Input
            label="Batas Stok Minimum (Peringatan Menipis)"
            type="number"
            min="1"
            value={partStokMin}
            onChange={(e) => setPartStokMin(parseInt(e.target.value) || 5)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddPartModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Simpan Spare Part
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Tambah Jasa */}
      <Modal
        isOpen={isAddJasaModal}
        onClose={() => setIsAddJasaModal(false)}
        title="Tambah Jasa Servis Baru"
        description="Tarif baku layanan bengkel."
      >
        <form onSubmit={handleAddJasa} className="space-y-4 text-xs">
          {errorMsg && <div className="p-3 rounded bg-rose-50 text-rose-700">{errorMsg}</div>}

          <Input
            label="Nama Layanan Jasa *"
            placeholder="Contoh: Tune-up Mesin"
            value={jasaNama}
            onChange={(e) => setJasaNama(e.target.value)}
            required
          />

          <Input
            label="Tarif Servis (Rp) *"
            type="number"
            min="0"
            placeholder="Contoh: 250000"
            value={jasaTarif}
            onChange={(e) => setJasaTarif(e.target.value ? Number(e.target.value) : '')}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddJasaModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Simpan Layanan Jasa
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Stok Masuk */}
      <Modal
        isOpen={isStokMasukModal}
        onClose={() => setIsStokMasukModal(false)}
        title={`Catat Stok Masuk: ${selectedItem?.nama}`}
        description="Stok akan bertambah dan tercatat di riwayat mutasi pergerakan stok."
      >
        <form onSubmit={handleStokMasuk} className="space-y-4 text-xs">
          <div>
            <span className="text-[#757575]">Stok Saat Ini:</span>
            <p className="font-bold text-sm text-[#212121]">{selectedItem?.stok} pcs</p>
          </div>

          <Input
            label="Jumlah Barang Masuk (Pcs) *"
            type="number"
            min="1"
            value={masukQty}
            onChange={(e) => setMasukQty(Math.max(1, parseInt(e.target.value) || 1))}
            required
          />

          <Input
            label="Keterangan / Sumber Barang"
            placeholder="Contoh: Pembelian faktur #108 dari Toko Sinar"
            value={masukKet}
            onChange={(e) => setMasukKet(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsStokMasukModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="success" isLoading={actionLoading}>
              Simpan Stok Masuk
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Sesuaikan Stok (Owner) */}
      <Modal
        isOpen={isAdjustStokModal}
        onClose={() => setIsAdjustStokModal(false)}
        title={`Penyesuaian Stok Fisik: ${selectedItem?.nama}`}
        description="Hasil opname stok fisik. Selisih dicatat sebagai penyesuaian di audit log."
      >
        <form onSubmit={handleAdjustStok} className="space-y-4 text-xs">
          <div>
            <span className="text-[#757575]">Stok Sistem:</span>
            <p className="font-bold text-sm text-[#212121]">{selectedItem?.stok} pcs</p>
          </div>

          <Input
            label="Stok Hasil Hitung Fisik Sebenarnya *"
            type="number"
            min="0"
            value={fisikQty}
            onChange={(e) => setFisikQty(Math.max(0, parseInt(e.target.value) || 0))}
            required
          />

          <Input
            label="Alasan Penyesuaian *"
            placeholder="Contoh: Stock opname bulanan, barang rusak / susut"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAdjustStokModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Simpan Hasil Opname
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Harga (Owner) */}
      <Modal
        isOpen={isEditItemModal}
        onClose={() => setIsEditItemModal(false)}
        title={`Ubah Data & Harga: ${selectedItem?.nama}`}
        description="Harga baru berlaku untuk penagihan WO berikutnya."
      >
        <form onSubmit={handleEditItem} className="space-y-4 text-xs">
          <Input
            label="Nama Item *"
            value={editNama}
            onChange={(e) => setEditNama(e.target.value)}
            required
          />

          <Input
            label="Harga Jual *"
            type="number"
            min="0"
            value={editJual}
            onChange={(e) => setEditJual(Number(e.target.value))}
            required
          />

          {selectedItem?.jenis === 'part' && isOwner && (
            <Input
              label="Harga Modal (Hanya Terlihat Owner) *"
              type="number"
              min="0"
              value={editModal}
              onChange={(e) => setEditModal(Number(e.target.value))}
              required
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditItemModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
