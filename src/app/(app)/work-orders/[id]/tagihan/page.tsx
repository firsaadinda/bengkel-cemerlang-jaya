'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  FileText,
  CreditCard,
  Edit2,
  Printer,
  Upload,
  CheckCircle,
  AlertCircle,
  Percent,
  Check,
  Wrench,
  Camera,
} from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { Profile, WorkOrder, BillingItem, Invoice, Payment } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatRupiah, formatDate, formatDateTime } from '@/lib/utils'

export default function WorkOrderTagihanPage() {
  const params = useParams()
  const router = useRouter()
  const woId = params.id as string
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [wo, setWo] = useState<any | null>(null)
  const [billingItems, setBillingItems] = useState<any[]>([])
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [isEditPriceModal, setIsEditPriceModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [newPrice, setNewPrice] = useState<number>(0)
  const [priceReasonCategory, setPriceReasonCategory] = useState('Harga khusus pelanggan')
  const [priceReasonCustom, setPriceReasonCustom] = useState('')
  const [belowCostWarning, setBelowCostWarning] = useState(false)

  const [isDiscountModal, setIsDiscountModal] = useState(false)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [discountReason, setDiscountReason] = useState('')

  const [isPaymentModal, setIsPaymentModal] = useState(false)
  const [payMethod, setPayMethod] = useState<'tunai' | 'transfer' | 'qris'>('tunai')
  const [payAmount, setPayAmount] = useState<number>(0)

  const [isDeliverModal, setIsDeliverModal] = useState(false)
  const [deliverPhotos, setDeliverPhotos] = useState<File[]>([])
  const [deliverPreviews, setDeliverPreviews] = useState<string[]>([])

  const [actionLoading, setActionLoading] = useState(false)

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

      // Fetch WO
      const { data: woData } = await supabase
        .from('work_orders')
        .select('*, vehicles(*), customers(*), kepala_mekanik:kepala_mekanik_id(nama)')
        .eq('id', woId)
        .single()
      if (woData) {
        setWo(woData)
        setDiscountAmount(woData.diskon || 0)
        setDiscountReason(woData.alasan_diskon || '')
      }

      // Fetch Billing Items (jika Owner, join billing_item_costs)
      let bQuery = supabase
        .from('billing_items')
        .select('*, billing_item_costs(harga_modal)')
        .eq('work_order_id', woId)
        .order('created_at', { ascending: true })

      const { data: bData } = await bQuery
      if (bData) setBillingItems(bData)

      // Fetch Invoice
      const { data: invData } = await supabase
        .from('invoices')
        .select('*')
        .eq('work_order_id', woId)
        .maybeSingle()

      if (invData) {
        setInvoice(invData as Invoice)
        // Fetch Payments
        const { data: payData } = await supabase
          .from('payments')
          .select('*, profiles(nama)')
          .eq('invoice_id', invData.id)
          .order('created_at', { ascending: false })
        if (payData) setPayments(payData as Payment[])
      } else {
        setInvoice(null)
        setPayments([])
      }
    } catch (err) {
      console.error('Error loading tagihan:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [woId])

  const isOwner = profile?.role === 'owner'
  const isAdminOrOwner = profile?.role === 'owner' || profile?.role === 'admin'
  const isLocked = !!invoice

  const rawSubtotal = billingItems.reduce((acc, curr) => acc + curr.jumlah * curr.harga_dipakai, 0)
  const currentDiscount = wo?.diskon || 0
  const totalBill = Math.max(0, rawSubtotal - currentDiscount)
  const totalCost = billingItems.reduce((acc, curr) => {
    const modal = curr.billing_item_costs?.harga_modal || 0
    return acc + modal * curr.jumlah
  }, 0)
  const profit = totalBill - totalCost

  // Handle Penyesuaian Harga Item
  const handleOpenEditPrice = (item: any) => {
    setSelectedItem(item)
    setNewPrice(item.harga_dipakai)
    setPriceReasonCategory('Harga khusus pelanggan')
    setPriceReasonCustom('')
    setBelowCostWarning(false)
    setIsEditPriceModal(true)
  }

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    const reason =
      priceReasonCategory === 'Lainnya' ? priceReasonCustom.trim() : priceReasonCategory
    if (!reason) {
      alert('Alasan penyesuaian harga wajib diisi')
      return
    }

    setActionLoading(true)
    try {
      const { data: isBelowCost, error } = await supabase.rpc('sesuaikan_harga_item', {
        p_billing_item: selectedItem.id,
        p_harga: newPrice,
        p_alasan: reason,
      })

      if (error) throw error

      if (isBelowCost) {
        alert('Perhatian: Harga yang Anda tetapkan berada di bawah harga modal!')
      }

      setIsEditPriceModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal menyesuaikan harga item')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Atur Diskon
  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (discountAmount > rawSubtotal) {
      alert('Diskon tidak boleh melebihi subtotal')
      return
    }
    if (discountAmount > 0 && !discountReason.trim()) {
      alert('Alasan diskon wajib diisi')
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('atur_diskon', {
        p_wo: woId,
        p_diskon: discountAmount,
        p_alasan: discountReason.trim(),
      })
      if (error) throw error
      setIsDiscountModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal mengatur diskon')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Terbitkan Invoice
  const handlePublishInvoice = async () => {
    if (wo.status !== 'siap_diambil') {
      alert('Invoice hanya bisa diterbitkan saat status Siap Diambil (setelah lulus QC)')
      return
    }
    if (billingItems.length === 0) {
      alert('Tidak ada item tagihan')
      return
    }
    if (!confirm('Terbitkan invoice sekarang? Baris tagihan dan diskon akan terkunci permanen.')) return

    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('terbitkan_invoice', {
        p_wo: woId,
      })
      if (error) throw error
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal menerbitkan invoice')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Catat Pembayaran
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice) return
    const sisa = invoice.total - invoice.terbayar
    if (payAmount <= 0 || payAmount > sisa) {
      alert(`Jumlah pembayaran harus antara Rp1 sampai ${formatRupiah(sisa)}`)
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('catat_pembayaran', {
        p_invoice: invoice.id,
        p_metode: payMethod,
        p_jumlah: payAmount,
      })
      if (error) throw error
      setIsPaymentModal(false)
      setPayAmount(0)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat pembayaran')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Foto Kondisi Akhir & Serahkan Mobil
  const handleDeliverPhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      if (deliverPhotos.length + selected.length > 4) {
        alert('Maksimal 4 foto kondisi akhir')
        return
      }

      const compressed = await Promise.all(
        selected.map(async (file) => {
          try {
            return await imageCompression(file, {
              maxSizeMB: 0.5,
              maxWidthOrHeight: 1600,
              useWebWorker: true,
              fileType: 'image/webp',
            })
          } catch {
            return file
          }
        })
      )

      const updated = [...deliverPhotos, ...compressed]
      setDeliverPhotos(updated)
      setDeliverPreviews(updated.map((f) => URL.createObjectURL(f)))
    }
  }

  const handleDeliverCar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (deliverPhotos.length < 1) {
      alert('Minimal 1 foto kondisi akhir mobil wajib diunggah sebelum serah terima')
      return
    }

    setActionLoading(true)
    try {
      // 1. Upload foto kondisi akhir
      for (let i = 0; i < deliverPhotos.length; i++) {
        const file = deliverPhotos[i]
        const path = `${woId}/kondisi_akhir/${Date.now()}_${i}.webp`
        const { error: upErr } = await supabase.storage.from('foto-wo').upload(path, file)
        if (!upErr) {
          await supabase.from('work_order_photos').insert({
            work_order_id: woId,
            jenis: 'kondisi_akhir',
            path,
            diunggah_oleh: profile?.id,
          })
        }
      }

      // 2. Ubah status ke diambil
      const { error: woErr } = await supabase.rpc('ubah_status_wo', {
        p_wo: woId,
        p_status: 'diambil',
        p_catatan: 'Mobil diserahkan kepada pelanggan',
      })
      if (woErr) throw woErr

      setIsDeliverModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal menyerahkan mobil')
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

  if (!wo) return null

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href={`/work-orders/${woId}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#757575] hover:text-[#212121] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Rincian Work Order</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="p-6 bg-white border border-[#EAF2FA] rounded-[16px] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Tagihan & Invoice: {wo.nomor}</h1>
            {invoice && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Invoice: {invoice.nomor}
              </span>
            )}
          </div>
          <p className="text-xs text-[#757575] mt-1">
            Pelanggan: {wo.customers?.nama} &middot; Plat: {wo.vehicles?.plat} ({wo.vehicles?.merek_model})
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!invoice && isAdminOrOwner && (
            <Button
              variant="primary"
              onClick={handlePublishInvoice}
              disabled={wo.status !== 'siap_diambil'}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Terbitkan Invoice</span>
            </Button>
          )}

          {invoice && (
            <Link href={`/work-orders/${woId}/invoice`}>
              <Button variant="outline" className="gap-2">
                <Printer className="w-4 h-4" />
                <span>Cetak Invoice</span>
              </Button>
            </Link>
          )}

          {invoice && invoice.status_bayar !== 'lunas' && isAdminOrOwner && (
            <Button
              variant="success"
              onClick={() => {
                setPayAmount(invoice.total - invoice.terbayar)
                setIsPaymentModal(true)
              }}
              className="gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>+ Catat Pembayaran</span>
            </Button>
          )}

          {invoice && invoice.status_bayar === 'lunas' && wo.status === 'siap_diambil' && isAdminOrOwner && (
            <Button variant="success" onClick={() => setIsDeliverModal(true)} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Serahkan Mobil ke Pelanggan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex items-center gap-4 border-b border-[#EAF2FA] text-xs font-semibold">
        <Link
          href={`/work-orders/${woId}`}
          className="pb-3 border-b-2 border-transparent text-[#757575] hover:text-[#212121] flex items-center gap-1.5 transition-colors"
        >
          <Wrench className="w-4 h-4" />
          <span>Rincian & Pengerjaan</span>
        </Link>
        <Link
          href={`/work-orders/${woId}/tagihan`}
          className="pb-3 border-b-2 border-[#2196F3] text-[#1976D2] flex items-center gap-1.5"
        >
          <DollarSign className="w-4 h-4" />
          <span>Tagihan & Pembayaran</span>
        </Link>
        {invoice && (
          <Link
            href={`/work-orders/${woId}/invoice`}
            className="pb-3 border-b-2 border-transparent text-[#757575] hover:text-[#212121] flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Lihat Invoice</span>
          </Link>
        )}
      </div>

      {/* Lock Notice if invoice is published */}
      {isLocked && (
        <div className="p-3.5 rounded-[12px] bg-blue-50/60 border border-blue-200 text-xs text-[#1976D2] flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-[#2E7D32]" />
          <span>
            Invoice telah diterbitkan ({invoice.nomor}). Rincian baris tagihan dan diskon telah dikunci permanen.
          </span>
        </div>
      )}

      {/* Main Billing Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-[#EAF2FA] flex items-center justify-between">
          <CardTitle>Rincian Baris Tagihan</CardTitle>
          {!isLocked && isAdminOrOwner && (
            <Button size="sm" variant="outline" onClick={() => setIsDiscountModal(true)}>
              <Percent className="w-3.5 h-3.5 mr-1" />
              Atur Diskon Tagihan
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F9FE] text-[#757575] font-semibold border-b border-[#EAF2FA]">
              <tr>
                <th className="px-5 py-3.5">Item Servis / Part</th>
                <th className="px-4 py-3.5">Jenis</th>
                <th className="px-4 py-3.5">Jumlah</th>
                <th className="px-4 py-3.5">Harga Master</th>
                <th className="px-4 py-3.5">Harga Dipakai</th>
                {isOwner && <th className="px-4 py-3.5 text-[#2E7D32]">Harga Modal</th>}
                <th className="px-4 py-3.5">Subtotal</th>
                {isOwner && <th className="px-4 py-3.5 text-[#2E7D32]">Laba Baris</th>}
                {!isLocked && isAdminOrOwner && <th className="px-4 py-3.5 text-right">Sesuaikan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2FA]">
              {billingItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-[#757575]">
                    Belum ada item tagihan.
                  </td>
                </tr>
              ) : (
                billingItems.map((item) => {
                  const isAdjusted = item.harga_dipakai !== item.harga_master
                  const subtotal = item.jumlah * item.harga_dipakai
                  const modal = item.billing_item_costs?.harga_modal || 0
                  const laba = subtotal - modal * item.jumlah

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-[#212121]">{item.nama_item}</p>
                        {isAdjusted && (
                          <span
                            className="inline-block mt-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                            title={`Alasan: ${item.alasan_penyesuaian}`}
                          >
                            Disesuaikan: {item.alasan_penyesuaian}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.jenis === 'part' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {item.jenis.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium">{item.jumlah}</td>
                      <td className="px-4 py-3.5 text-[#757575] tabular-nums">{formatRupiah(item.harga_master)}</td>
                      <td className="px-4 py-3.5 font-semibold text-[#212121] tabular-nums">
                        {formatRupiah(item.harga_dipakai)}
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3.5 text-[#757575] tabular-nums">
                          {modal > 0 ? formatRupiah(modal) : '-'}
                        </td>
                      )}
                      <td className="px-4 py-3.5 font-bold text-[#212121] tabular-nums">{formatRupiah(subtotal)}</td>
                      {isOwner && (
                        <td className="px-4 py-3.5 font-bold text-[#2E7D32] tabular-nums">
                          {formatRupiah(laba)}
                        </td>
                      )}
                      {!isLocked && isAdminOrOwner && (
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenEditPrice(item)}
                            className="p-1.5 rounded-lg border border-[#EAF2FA] hover:bg-white text-[#1976D2] cursor-pointer"
                            title="Sesuaikan harga"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="p-6 bg-[#F2F9FE] border-t border-[#EAF2FA] flex flex-col items-end space-y-2 text-xs">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-[#757575]">
              <span>Subtotal:</span>
              <span className="font-semibold text-[#212121] tabular-nums">{formatRupiah(rawSubtotal)}</span>
            </div>
            {currentDiscount > 0 && (
              <div className="flex justify-between text-[#E53935]">
                <span>Diskon ({wo.alasan_diskon}):</span>
                <span className="font-semibold tabular-nums">- {formatRupiah(currentDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-[#212121] pt-2 border-t border-[#EAF2FA]">
              <span>Total Tagihan:</span>
              <span className="tabular-nums">{formatRupiah(totalBill)}</span>
            </div>

            {/* Owner Laba Card */}
            {isOwner && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Total Laba Kotor WO:</span>
                  <span className="tabular-nums">{formatRupiah(profit)}</span>
                </div>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  Total Modal Part: {formatRupiah(totalCost)} &middot; Margin:{' '}
                  {totalBill > 0 ? ((profit / totalBill) * 100).toFixed(1) : 0}%
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Invoice & Payments Section */}
      {invoice && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembayaran & Status Invoice</CardTitle>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                invoice.status_bayar === 'lunas'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : invoice.status_bayar === 'sebagian'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {invoice.status_bayar.replace('_', ' ')}
            </span>
          </CardHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-[#EAF2FA] text-xs">
              <div>
                <span className="text-[#757575]">Nomor Invoice:</span>
                <p className="font-bold text-[#212121] text-sm mt-0.5">{invoice.nomor}</p>
                <p className="text-[#757575] text-[11px] mt-0.5">Diterbitkan: {formatDateTime(invoice.diterbitkan_at)}</p>
              </div>
              <div>
                <span className="text-[#757575]">Sudah Dibayar:</span>
                <p className="font-bold text-[#2E7D32] text-sm mt-0.5 tabular-nums">
                  {formatRupiah(invoice.terbayar)}
                </p>
              </div>
              <div>
                <span className="text-[#757575]">Sisa Tagihan:</span>
                <p className="font-bold text-[#E53935] text-sm mt-0.5 tabular-nums">
                  {formatRupiah(invoice.total - invoice.terbayar)}
                </p>
              </div>
            </div>

            {/* Payments List */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-[#757575] uppercase tracking-wider">Transaksi Pembayaran:</p>
              {payments.length > 0 ? (
                payments.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg border border-[#EAF2FA] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#212121] uppercase">{p.metode}</span>
                      <p className="text-[#757575] text-[11px]">Dicatat oleh: {p.profiles?.nama || 'Admin'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#2E7D32] tabular-nums">{formatRupiah(p.jumlah)}</span>
                      <p className="text-[10px] text-[#757575]">{formatDateTime(p.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#757575] italic">Belum ada pembayaran yang dicatat.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SESUAIKAN HARGA ITEM */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditPriceModal}
        onClose={() => setIsEditPriceModal(false)}
        title="Sesuaikan Harga Item"
        description="Perubahan harga hanya berlaku untuk WO ini dan wajib beralasan."
      >
        <form onSubmit={handleSavePrice} className="space-y-4 text-xs">
          <div>
            <p className="font-bold text-sm text-[#212121]">{selectedItem?.nama_item}</p>
            <p className="text-[#757575]">Harga Master: {formatRupiah(selectedItem?.harga_master)}</p>
          </div>

          <div>
            <Input
              label="Harga Dipakai (Baru) *"
              type="number"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-1">Kategori Alasan Penyesuaian *</label>
            <select
              value={priceReasonCategory}
              onChange={(e) => setPriceReasonCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
            >
              <option value="Harga khusus pelanggan">Harga khusus pelanggan</option>
              <option value="Negosiasi">Negosiasi</option>
              <option value="Harga paket">Harga paket</option>
              <option value="Koreksi harga master">Koreksi harga master</option>
              <option value="Lainnya">Lainnya (Tulis manual)</option>
            </select>
          </div>

          {priceReasonCategory === 'Lainnya' && (
            <div>
              <Input
                label="Tuliskan Alasan *"
                placeholder="Alasan penyesuaian harga..."
                value={priceReasonCustom}
                onChange={(e) => setPriceReasonCustom(e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditPriceModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Simpan Penyesuaian
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ATUR DISKON */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDiscountModal}
        onClose={() => setIsDiscountModal(false)}
        title="Atur Diskon Total Tagihan"
        description="Diskon akan memotong total tagihan dan wajib mencantumkan alasan."
      >
        <form onSubmit={handleSaveDiscount} className="space-y-4 text-xs">
          <div>
            <Input
              label="Nominal Diskon (Rp) *"
              type="number"
              min="0"
              max={rawSubtotal}
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <Input
              label="Alasan Diskon *"
              placeholder="Contoh: Diskon promo akhir pekan / Pelanggan loyal"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              required={discountAmount > 0}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsDiscountModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Simpan Diskon
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: CATAT PEMBAYARAN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPaymentModal}
        onClose={() => setIsPaymentModal(false)}
        title="Catat Pembayaran Invoice"
        description={`Sisa tagihan yang harus dibayar: ${invoice ? formatRupiah(invoice.total - invoice.terbayar) : ''}`}
      >
        <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-1">Metode Pembayaran *</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as any)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
            >
              <option value="tunai">Tunai / Cash</option>
              <option value="transfer">Transfer Bank</option>
              <option value="qris">QRIS</option>
            </select>
          </div>

          <div>
            <Input
              label="Jumlah Pembayaran (Rp) *"
              type="number"
              min="1"
              max={invoice ? invoice.total - invoice.terbayar : undefined}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsPaymentModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="success" isLoading={actionLoading}>
              Konfirmasi Pembayaran
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: SERAHKAN MOBIL (FOTO AKHIR) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDeliverModal}
        onClose={() => setIsDeliverModal(false)}
        title="Serah Terima Kendaraan ke Pelanggan"
        description="Unggah 1 sampai 4 foto kondisi akhir mobil yang telah selesai dikerjakan sebelum mobil diambil."
      >
        <form onSubmit={handleDeliverCar} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-2">
              Foto Kondisi Akhir Mobil * (1-4 Foto)
            </label>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-dashed border-[#2196F3] bg-blue-50/50 hover:bg-blue-50 text-xs text-[#1976D2] font-semibold">
              <Upload className="w-4 h-4" />
              <span>Unggah Foto Mobil Bersih / Selesai</span>
              <input type="file" accept="image/*" multiple onChange={handleDeliverPhotosChange} className="hidden" />
            </label>

            {deliverPreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {deliverPreviews.map((src, idx) => (
                  <div key={idx} className="relative w-full h-20 rounded-lg overflow-hidden border border-[#EAF2FA]">
                    <img src={src} alt={`Akhir ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-[#2E7D32]" />
            <span>Invoice telah lunas. Setelah diserahkan, status WO akan menjadi &quot;Diambil&quot;.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsDeliverModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="success" isLoading={actionLoading}>
              Serahkan Mobil & Selesai
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
