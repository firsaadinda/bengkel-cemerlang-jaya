'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Wrench,
  User,
  Car,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  ShieldCheck,
  Phone,
  Camera,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, WorkOrder, Mekanik, InventoryItem, WOStatus } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatRupiah, formatDate, formatDateTime, STATUS_WO_CONFIG } from '@/lib/utils'

export default function WorkOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const woId = params.id as string
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [wo, setWo] = useState<any | null>(null)
  const [assignedMekanik, setAssignedMekanik] = useState<Mekanik[]>([])
  const [teamMekaniks, setTeamMekaniks] = useState<Mekanik[]>([])
  const [billingItems, setBillingItems] = useState<any[]>([])
  const [statusHistory, setStatusHistory] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [signedPhotoUrls, setSignedPhotoUrls] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Modal States
  const [isTugaskanModal, setIsTugaskanModal] = useState(false)
  const [selectedMekanikIds, setSelectedMekanikIds] = useState<string[]>([])
  const [estimasiDate, setEstimasiDate] = useState('')

  const [isAddItemModal, setIsAddItemModal] = useState(false)
  const [itemType, setItemType] = useState<'part' | 'jasa'>('part')
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [itemQty, setItemQty] = useState(1)

  const [isDiagnosisModal, setIsDiagnosisModal] = useState(false)
  const [diagnosisText, setDiagnosisText] = useState('')

  const [isTundaModal, setIsTundaModal] = useState(false)
  const [tundaReason, setTundaReason] = useState('')

  const [isQcModal, setIsQcModal] = useState(false)
  const [isQcPass, setIsQcPass] = useState(true)
  const [qcNote, setQcNote] = useState('')

  const [isCancelModal, setIsCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function loadData() {
    setIsLoading(true)
    try {
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
      if (prof) setProfile(prof as Profile)

      // Fetch Work Order
      const { data: woData, error: woErr } = await supabase
        .from('work_orders')
        .select(`
          *,
          vehicles(*),
          customers(*),
          kepala_mekanik:kepala_mekanik_id(id, nama, email),
          invoices(id, nomor, subtotal, diskon, total, terbayar, status_bayar)
        `)
        .eq('id', woId)
        .single()

      if (woErr || !woData) {
        setErrorMsg('Work Order tidak ditemukan')
        setIsLoading(false)
        return
      }
      setWo(woData)
      setDiagnosisText(woData.diagnosis || '')
      if (woData.estimasi_selesai) setEstimasiDate(woData.estimasi_selesai)

      // Assigned mechanics
      const { data: wm } = await supabase
        .from('work_order_mekanik')
        .select('mekanik(*)')
        .eq('work_order_id', woId)
      if (wm) {
        const meks = wm.map((item: any) => item.mekanik).filter(Boolean)
        setAssignedMekanik(meks)
        setSelectedMekanikIds(meks.map((m: any) => m.id))
      }

      // Team mechanics (for assignment)
      const { data: teamMeks } = await supabase
        .from('mekanik')
        .select('*')
        .eq('kepala_mekanik_id', woData.kepala_mekanik_id)
        .eq('aktif', true)
      if (teamMeks) setTeamMekaniks(teamMeks as Mekanik[])

      // Billing Items
      const { data: bItems } = await supabase
        .from('billing_items')
        .select('*')
        .eq('work_order_id', woId)
        .order('created_at', { ascending: true })
      if (bItems) setBillingItems(bItems)

      // Status History
      const { data: history } = await supabase
        .from('wo_status_history')
        .select('*, profiles(nama, role)')
        .eq('work_order_id', woId)
        .order('created_at', { ascending: false })
      if (history) setStatusHistory(history)

      // Photos
      const { data: photoList } = await supabase
        .from('work_order_photos')
        .select('*')
        .eq('work_order_id', woId)

      if (photoList && photoList.length > 0) {
        setPhotos(photoList)
        // Generate signed URLs (10 min expiry)
        const paths = photoList.map((p) => p.path)
        const { data: signed } = await supabase.storage
          .from('foto-wo')
          .createSignedUrls(paths, 600)
        if (signed) {
          const map: Record<string, string> = {}
          signed.forEach((s) => {
            if (s.path && s.signedUrl) map[s.path] = s.signedUrl
          })
          setSignedPhotoUrls(map)
        }
      }
    } catch (err) {
      console.error('Error loading WO detail:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [woId])

  // Load Inventory Items for add item modal
  useEffect(() => {
    async function fetchInventory() {
      if (!isAddItemModal) return
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('jenis', itemType)
        .eq('aktif', true)
        .order('nama', { ascending: true })
      if (data) {
        setAvailableItems(data as InventoryItem[])
        if (data.length > 0) setSelectedItemId(data[0].id)
      }
    }
    fetchInventory()
  }, [isAddItemModal, itemType])

  // Check if current user is Kepala Mekanik for this WO or Owner
  const isTeamHeadOrOwner =
    profile && (profile.role === 'owner' || (profile.role === 'kepala_mekanik' && profile.id === wo?.kepala_mekanik_id))
  const isAdminOrOwner = profile && (profile.role === 'owner' || profile.role === 'admin')

  // Action: Tugaskan & Mulai Kerjakan
  const handleAssignAndStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedMekanikIds.length === 0) {
      alert('Pilih minimal 1 mekanik')
      return
    }
    if (!estimasiDate) {
      alert('Estimasi selesai wajib diisi')
      return
    }

    setActionLoading(true)
    try {
      const { error: tugaskanErr } = await supabase.rpc('tugaskan_mekanik', {
        p_wo: woId,
        p_mekanik: selectedMekanikIds,
        p_estimasi: estimasiDate,
      })
      if (tugaskanErr) throw tugaskanErr

      const { error: startErr } = await supabase.rpc('ubah_status_wo', {
        p_wo: woId,
        p_status: 'dikerjakan',
      })
      if (startErr) throw startErr

      setIsTugaskanModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal memulai pengerjaan')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Simpan Diagnosis
  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ diagnosis: diagnosisText.trim() })
        .eq('id', woId)
      if (error) throw error
      setIsDiagnosisModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan diagnosis')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Tambah Item Tagihan (Part / Jasa)
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId) return
    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('tambah_item_tagihan', {
        p_wo: woId,
        p_item: selectedItemId,
        p_jumlah: itemQty,
      })
      if (error) throw error
      setIsAddItemModal(false)
      setItemQty(1)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan item tagihan')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Hapus Item Tagihan
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Yakin ingin menghapus item ini? Stok spare part akan dikembalikan.')) return
    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('hapus_item_tagihan', {
        p_billing_item: itemId,
      })
      if (error) throw error
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus item')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Tunda WO
  const handleTunda = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tundaReason.trim()) {
      alert('Alasan penundaan wajib diisi')
      return
    }
    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('ubah_status_wo', {
        p_wo: woId,
        p_status: 'tertunda',
        p_catatan: tundaReason.trim(),
      })
      if (error) throw error
      setIsTundaModal(false)
      setTundaReason('')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal menunda work order')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Lanjutkan WO
  const handleLanjutkan = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('ubah_status_wo', {
        p_wo: woId,
        p_status: 'dikerjakan',
      })
      if (error) throw error
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal melanjutkan pengerjaan')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Selesai Pengerjaan
  const handleSelesai = async () => {
    if (billingItems.length === 0) {
      alert('Catat minimal 1 jasa atau spare part sebelum menandai selesai')
      return
    }
    if (!confirm('Tandai pengerjaan selesai? Status akan berpindah ke Selesai untuk menunggu QC.')) return

    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('ubah_status_wo', {
        p_wo: woId,
        p_status: 'selesai',
      })
      if (error) throw error
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal menyelesaikan pengerjaan')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: QC (Lulus / Gagal)
  const handleQC = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isQcPass && !qcNote.trim()) {
      alert('Catatan alasan QC gagal wajib diisi')
      return
    }
    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('ubah_status_wo', {
        p_wo: woId,
        p_status: isQcPass ? 'siap_diambil' : 'dikerjakan',
        p_catatan: isQcPass ? qcNote.trim() || 'QC Lulus' : qcNote.trim(),
      })
      if (error) throw error
      setIsQcModal(false)
      setQcNote('')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal memproses hasil QC')
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Batalkan WO
  const handleCancelWO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancelReason.trim()) {
      alert('Alasan pembatalan wajib diisi')
      return
    }
    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('ubah_status_wo', {
        p_wo: woId,
        p_status: 'dibatalkan',
        p_catatan: cancelReason.trim(),
      })
      if (error) throw error
      setIsCancelModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan Work Order')
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2196F3]" />
      </div>
    )
  }

  if (!wo) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#757575]">{errorMsg || 'Work Order tidak ditemukan.'}</p>
        <Link href="/work-orders" className="mt-4 inline-block text-xs text-[#2196F3] font-semibold">
          &larr; Kembali ke daftar
        </Link>
      </div>
    )
  }

  const conf = STATUS_WO_CONFIG[wo.status as WOStatus]
  const isLate =
    wo.estimasi_selesai &&
    new Date(wo.estimasi_selesai) < new Date() &&
    !['selesai', 'siap_diambil', 'diambil', 'dibatalkan'].includes(wo.status)

  const stnkPhotos = photos.filter((p) => p.jenis === 'stnk')
  const awalPhotos = photos.filter((p) => p.jenis === 'kondisi_awal')
  const akhirPhotos = photos.filter((p) => p.jenis === 'kondisi_akhir')

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1.5 text-xs text-[#757575] hover:text-[#212121] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Work Order</span>
        </Link>
      </div>

      {/* Main Header Card with Actions */}
      <div className="p-6 bg-white border border-[#EAF2FA] rounded-[16px] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">{wo.nomor}</h1>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${conf.badgeClass}`}>
              {conf.label}
            </span>
            {isLate && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 rounded-full">
                Terlambat
              </span>
            )}
          </div>
          <p className="text-xs text-[#757575] mt-1">
            Dibuat pada {formatDateTime(wo.created_at)} &middot; Tim: {wo.kepala_mekanik?.nama}
          </p>
        </div>

        {/* Action Buttons based on status & role */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status: Menunggu */}
          {wo.status === 'menunggu' && isTeamHeadOrOwner && (
            <Button onClick={() => setIsTugaskanModal(true)} className="gap-2">
              <Play className="w-4 h-4" />
              <span>Tugaskan & Mulai Kerjakan</span>
            </Button>
          )}

          {/* Status: Dikerjakan */}
          {wo.status === 'dikerjakan' && isTeamHeadOrOwner && (
            <>
              <Button variant="secondary" onClick={() => setIsTundaModal(true)} className="gap-2">
                <Pause className="w-4 h-4" />
                <span>Tunda</span>
              </Button>
              <Button variant="success" onClick={handleSelesai} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Selesai Dikerjakan</span>
              </Button>
            </>
          )}

          {/* Status: Tertunda */}
          {wo.status === 'tertunda' && isTeamHeadOrOwner && (
            <Button variant="primary" onClick={handleLanjutkan} className="gap-2">
              <Play className="w-4 h-4" />
              <span>Lanjutkan Pengerjaan</span>
            </Button>
          )}

          {/* Status: Selesai (Menunggu QC) */}
          {wo.status === 'selesai' && isTeamHeadOrOwner && (
            <>
              <Button
                variant="success"
                onClick={() => {
                  setIsQcPass(true)
                  setIsQcModal(true)
                }}
                className="gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>QC Lulus</span>
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setIsQcPass(false)
                  setIsQcModal(true)
                }}
                className="gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>QC Gagal</span>
              </Button>
            </>
          )}

          {/* Buka Tagihan & Invoice */}
          <Link href={`/work-orders/${woId}/tagihan`}>
            <Button variant="outline" className="gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Buka Tagihan</span>
            </Button>
          </Link>

          {/* Pembatalan WO (menunggu, dikerjakan, tertunda) */}
          {['menunggu', 'dikerjakan', 'tertunda'].includes(wo.status) && isAdminOrOwner && (
            <Button variant="ghost" onClick={() => setIsCancelModal(true)} className="text-[#E53935] hover:bg-rose-50">
              <XCircle className="w-4 h-4 mr-1" />
              <span>Batalkan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-[#EAF2FA] text-xs font-semibold">
        <Link
          href={`/work-orders/${woId}`}
          className="pb-3 border-b-2 border-[#2196F3] text-[#1976D2] flex items-center gap-1.5"
        >
          <Wrench className="w-4 h-4" />
          <span>Rincian & Pengerjaan</span>
        </Link>
        <Link
          href={`/work-orders/${woId}/tagihan`}
          className="pb-3 border-b-2 border-transparent text-[#757575] hover:text-[#212121] flex items-center gap-1.5 transition-colors"
        >
          <DollarSign className="w-4 h-4" />
          <span>Tagihan & Pembayaran</span>
        </Link>
        {wo.invoices && (
          <Link
            href={`/work-orders/${woId}/invoice`}
            className="pb-3 border-b-2 border-transparent text-[#757575] hover:text-[#212121] flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Lihat Invoice</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Bagian A, B, C */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bagian A: Data Masuk */}
          <Card>
            <CardHeader>
              <CardTitle>Bagian A. Data Masuk & Kendaraan</CardTitle>
            </CardHeader>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F2F9FE] border border-[#EAF2FA]">
                {/* Pelanggan */}
                <div>
                  <p className="text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-1">Pelanggan</p>
                  <p className="text-sm font-bold text-[#212121]">{wo.customers?.nama}</p>
                  <p className="text-[#4A5565] mt-0.5">Tipe: {wo.customers?.tipe}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[#4A5565]">{wo.customers?.telepon}</span>
                    <a
                      href={`https://wa.me/${wo.customers?.telepon.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200"
                    >
                      <Phone className="w-3 h-3" /> WA
                    </a>
                  </div>
                </div>

                {/* Kendaraan */}
                <div>
                  <p className="text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-1">Kendaraan</p>
                  <p className="text-sm font-bold text-[#1976D2]">{wo.vehicles?.plat}</p>
                  <p className="text-[#212121] font-medium">{wo.vehicles?.merek_model}</p>
                  <p className="text-[#757575] mt-0.5">
                    Tahun {wo.vehicles?.tahun || '-'} &middot; {wo.vehicles?.warna || '-'} &middot; {wo.vehicles?.transmisi || '-'}
                  </p>
                </div>
              </div>

              {/* Odometer, Keluhan & Diagnosis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#757575]">Odometer Saat Masuk:</span>
                  <span className="font-bold text-[#212121]">{wo.odometer?.toLocaleString()} km</span>
                </div>

                <div className="p-3 rounded-lg border border-[#EAF2FA] bg-slate-50">
                  <p className="text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-1">Keluhan Pelanggan:</p>
                  <p className="text-sm text-[#212121] leading-relaxed">{wo.keluhan}</p>
                </div>

                <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/40">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold text-[#1976D2] uppercase tracking-wider">Hasil Diagnosis Mekanik:</p>
                    {isTeamHeadOrOwner && ['dikerjakan', 'tertunda'].includes(wo.status) && (
                      <button
                        onClick={() => setIsDiagnosisModal(true)}
                        className="text-xs text-[#1976D2] font-semibold hover:underline cursor-pointer"
                      >
                        Edit Diagnosis
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[#212121] leading-relaxed">
                    {wo.diagnosis || 'Belum ada catatan diagnosis pengerjaan.'}
                  </p>
                </div>
              </div>

              {/* Foto STNK & Foto Fisik */}
              <div className="pt-2 border-t border-[#EAF2FA] space-y-3">
                <p className="text-[11px] font-bold text-[#757575] uppercase tracking-wider">Foto Dokumentasi Fisik:</p>
                <div className="flex flex-wrap gap-3">
                  {stnkPhotos.map((p) => (
                    <div key={p.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#EAF2FA]">
                      <img src={signedPhotoUrls[p.path] || ''} alt="STNK" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] py-0.5 text-center font-semibold">
                        STNK
                      </span>
                    </div>
                  ))}
                  {awalPhotos.map((p, idx) => (
                    <div key={p.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#EAF2FA]">
                      <img src={signedPhotoUrls[p.path] || ''} alt="Awal" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] py-0.5 text-center font-semibold">
                        Awal #{idx + 1}
                      </span>
                    </div>
                  ))}
                  {akhirPhotos.map((p, idx) => (
                    <div key={p.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-emerald-300">
                      <img src={signedPhotoUrls[p.path] || ''} alt="Akhir" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-[#2E7D32] text-white text-[9px] py-0.5 text-center font-semibold">
                        Akhir #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Bagian B: Penugasan Mekanik */}
          <Card>
            <CardHeader>
              <CardTitle>Bagian B. Tim & Penugasan Mekanik</CardTitle>
              {wo.status === 'menunggu' && isTeamHeadOrOwner && (
                <Button size="sm" variant="secondary" onClick={() => setIsTugaskanModal(true)}>
                  Atur Penugasan
                </Button>
              )}
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#757575]">Kepala Mekanik (Penanggung Jawab):</span>
                <span className="font-bold text-[#212121]">{wo.kepala_mekanik?.nama}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#757575]">Target Estimasi Selesai:</span>
                <span className="font-bold text-[#212121]">
                  {wo.estimasi_selesai ? formatDate(wo.estimasi_selesai) : 'Belum ditentukan'}
                </span>
              </div>
              <div className="pt-2 border-t border-[#EAF2FA]">
                <p className="text-[11px] font-bold text-[#757575] uppercase tracking-wider mb-2">Mekanik yang Ditugaskan:</p>
                {assignedMekanik.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assignedMekanik.map((m) => (
                      <span key={m.id} className="px-3 py-1 rounded-full bg-[#DCEBFB] text-[#1976D2] font-semibold text-xs border border-blue-200">
                        {m.nama}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#757575] italic">Belum ada mekanik yang ditugaskan</p>
                )}
              </div>
            </div>
          </Card>

          {/* Bagian C: Pengerjaan (Spare Part & Jasa) */}
          <Card>
            <CardHeader>
              <CardTitle>Bagian C. Pengerjaan Servis & Pemakaian Spare Part</CardTitle>
              {wo.status === 'dikerjakan' && isTeamHeadOrOwner && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setItemType('part')
                      setIsAddItemModal(true)
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    + Spare Part
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setItemType('jasa')
                      setIsAddItemModal(true)
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    + Jasa
                  </Button>
                </div>
              )}
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F2F9FE] text-[#757575] font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Item</th>
                    <th className="px-3 py-2.5">Jenis</th>
                    <th className="px-3 py-2.5">Qty</th>
                    <th className="px-3 py-2.5">Harga</th>
                    <th className="px-3 py-2.5">Subtotal</th>
                    {wo.status === 'dikerjakan' && isTeamHeadOrOwner && <th className="px-3 py-2.5 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2FA]">
                  {billingItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[#757575]">
                        Belum ada spare part atau jasa yang dicatat.
                      </td>
                    </tr>
                  ) : (
                    billingItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-[#212121]">{item.nama_item}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.jenis === 'part' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {item.jenis.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-3">{item.jumlah}</td>
                        <td className="px-3 py-3 tabular-nums">{formatRupiah(item.harga_dipakai)}</td>
                        <td className="px-3 py-3 font-bold text-[#212121] tabular-nums">
                          {formatRupiah(item.jumlah * item.harga_dipakai)}
                        </td>
                        {wo.status === 'dikerjakan' && isTeamHeadOrOwner && (
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-[#E53935] hover:bg-rose-50 rounded cursor-pointer"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Status Timeline & Summary Card */}
        <div className="space-y-6">
          {/* Quick Invoice Card */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Tagihan</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#757575]">Total Estimasi Tagihan:</span>
                <span className="text-base font-bold text-[#212121] tabular-nums">
                  {formatRupiah(billingItems.reduce((acc, curr) => acc + curr.jumlah * curr.harga_dipakai, 0) - (wo.diskon || 0))}
                </span>
              </div>
              {wo.invoices && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center justify-between text-emerald-800 font-semibold">
                    <span>Invoice {wo.invoices.nomor}</span>
                    <span className="capitalize">{wo.invoices.status_bayar}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Terbayar: {formatRupiah(wo.invoices.terbayar)} dari {formatRupiah(wo.invoices.total)}
                  </p>
                </div>
              )}
              <Link href={`/work-orders/${woId}/tagihan`} className="block">
                <Button className="w-full py-2">Buka Halaman Tagihan &rarr;</Button>
              </Link>
            </div>
          </Card>

          {/* Riwayat Linimasa Status (wo_status_history) */}
          <Card>
            <CardHeader>
              <CardTitle>Linimasa Riwayat Status</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {statusHistory.map((h, idx) => (
                <div key={h.id} className="relative pl-6 pb-2 text-xs border-l-2 border-[#EAF2FA] last:border-none">
                  <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-[#2196F3]" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#212121] capitalize">
                      {STATUS_WO_CONFIG[h.ke_status as WOStatus]?.label || h.ke_status}
                    </span>
                    <span className="text-[10px] text-[#757575]">{formatDateTime(h.created_at)}</span>
                  </div>
                  <p className="text-[11px] text-[#4A5565] mt-0.5">Oleh: {h.profiles?.nama || 'Sistem'}</p>
                  {h.catatan && (
                    <p className="mt-1 p-2 rounded bg-[#F2F9FE] text-[11px] text-[#212121] italic">
                      &ldquo;{h.catatan}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TUGASKAN & MULAI KERJAKAN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTugaskanModal}
        onClose={() => setIsTugaskanModal(false)}
        title="Tugaskan Mekanik & Mulai Pengerjaan"
        description="Pilih 1 sampai 3 mekanik dan tentukan target tanggal estimasi selesai."
      >
        <form onSubmit={handleAssignAndStart} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-2">
              Pilih Mekanik Tim ({wo.kepala_mekanik?.nama}) *
            </label>
            <div className="space-y-2">
              {teamMekaniks.map((m) => (
                <label key={m.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-[#EAF2FA] hover:bg-[#F2F9FE] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMekanikIds.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedMekanikIds.length >= 3) {
                          alert('Maksimal 3 mekanik per WO')
                          return
                        }
                        setSelectedMekanikIds([...selectedMekanikIds, m.id])
                      } else {
                        setSelectedMekanikIds(selectedMekanikIds.filter((id) => id !== m.id))
                      }
                    }}
                    className="rounded text-[#2196F3]"
                  />
                  <span className="font-semibold text-[#212121]">{m.nama}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-1">Target Estimasi Selesai *</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={estimasiDate}
              onChange={(e) => setEstimasiDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsTugaskanModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Mulai Kerjakan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH SPARE PART / JASA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddItemModal}
        onClose={() => setIsAddItemModal(false)}
        title={itemType === 'part' ? 'Tambah Spare Part ke WO' : 'Tambah Jasa ke WO'}
        description={
          itemType === 'part'
            ? 'Stok akan otomatis dikurangi secara aman melalui transaksi database.'
            : 'Jasa servis akan ditambahkan ke pengerjaan.'
        }
      >
        <form onSubmit={handleAddItem} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-1">
              Pilih {itemType === 'part' ? 'Spare Part' : 'Jasa Servis'} *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121]"
              required
            >
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama} - {formatRupiah(item.harga_jual)}{' '}
                  {item.jenis === 'part' ? `(Sisa Stok: ${item.stok})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Jumlah *"
              type="number"
              min="1"
              value={itemQty}
              onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsAddItemModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Tambahkan ke Tagihan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT DIAGNOSIS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDiagnosisModal}
        onClose={() => setIsDiagnosisModal(false)}
        title="Catat Hasil Diagnosis Mekanik"
        description="Hasil pemeriksaan fisik dan temuan penyebab kerusakan mobil."
      >
        <form onSubmit={handleSaveDiagnosis} className="space-y-4 text-xs">
          <div>
            <textarea
              rows={4}
              placeholder="Tuliskan diagnosis kerusakan dan rencana penanganan..."
              value={diagnosisText}
              onChange={(e) => setDiagnosisText(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121]"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDiagnosisModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Simpan Diagnosis
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: TUNDA WO */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTundaModal}
        onClose={() => setIsTundaModal(false)}
        title="Tunda Pengerjaan Work Order"
        description="Pengerjaan akan berhenti sementara. Catatan alasan wajib diisi."
      >
        <form onSubmit={handleTunda} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-1">Alasan Penundaan *</label>
            <textarea
              rows={3}
              placeholder="Contoh: Menunggu spare part kampas rem khusus tiba dari pemasok..."
              value={tundaReason}
              onChange={(e) => setTundaReason(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTundaModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="secondary" isLoading={actionLoading}>
              Simpan & Tunda
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: QC HASIL KERJA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isQcModal}
        onClose={() => setIsQcModal(false)}
        title={isQcPass ? 'Pemeriksaan Hasil Kerja (QC Lulus)' : 'Pemeriksaan Hasil Kerja (QC Gagal)'}
        description={
          isQcPass
            ? 'Mobil telah diperiksa dan siap ditagih dan diambil pemiliknya.'
            : 'Mobil belum memenuhi standar. Pengerjaan akan kembali ke status Dikerjakan.'
        }
      >
        <form onSubmit={handleQC} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-1">
              Catatan QC {isQcPass ? '(Opsional)' : '* (Wajib)'}
            </label>
            <textarea
              rows={3}
              placeholder={isQcPass ? 'Catatan hasil uji coba mobil...' : 'Jelaskan bagian apa yang masih kurang / bermasalah...'}
              value={qcNote}
              onChange={(e) => setQcNote(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
              required={!isQcPass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsQcModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant={isQcPass ? 'success' : 'danger'} isLoading={actionLoading}>
              {isQcPass ? 'Konfirmasi QC Lulus' : 'Kembalikan ke Pengerjaan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: BATALKAN WORK ORDER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCancelModal}
        onClose={() => setIsCancelModal(false)}
        title="Batalkan Work Order"
        description="Semua spare part yang sudah terpasang akan otomatis dikembalikan ke stok gudang."
      >
        <form onSubmit={handleCancelWO} className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs">
            Tindakan ini tidak dapat dibatalkan. Work Order akan berstatus dibatalkan.
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-1">Alasan Pembatalan *</label>
            <textarea
              rows={3}
              placeholder="Contoh: Pelanggan membatalkan servis karena urusan mendadak..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCancelModal(false)}>
              Tutup
            </Button>
            <Button type="submit" variant="danger" isLoading={actionLoading}>
              Konfirmasi Pembatalan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
