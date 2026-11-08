'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Car } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Invoice, WorkOrder, BillingItem, WorkshopSettings } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { formatRupiah, formatDate, formatDateTime } from '@/lib/utils'

export default function InvoicePrintPage() {
  const params = useParams()
  const router = useRouter()
  const woId = params.id as string
  const supabase = createClient()

  const [wo, setWo] = useState<any | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [billingItems, setBillingItems] = useState<BillingItem[]>([])
  const [settings, setSettings] = useState<WorkshopSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Fetch Settings
        const { data: setts } = await supabase
          .from('workshop_settings')
          .select('*')
          .eq('id', 1)
          .single()
        if (setts) setSettings(setts)

        // Fetch WO
        const { data: woData } = await supabase
          .from('work_orders')
          .select('*, vehicles(*), customers(*)')
          .eq('id', woId)
          .single()
        if (woData) setWo(woData)

        // Fetch Invoice
        const { data: invData } = await supabase
          .from('invoices')
          .select('*')
          .eq('work_order_id', woId)
          .single()
        if (invData) setInvoice(invData as Invoice)

        // Fetch Billing Items (TIDAK menyertakan harga modal!)
        const { data: items } = await supabase
          .from('billing_items')
          .select('id, nama_item, jenis, jumlah, harga_dipakai, work_order_id, item_id, harga_master, created_at, alasan_penyesuaian, disesuaikan_oleh, disesuaikan_at, ditambah_oleh')
          .eq('work_order_id', woId)
          .order('created_at', { ascending: true })
        if (items) setBillingItems(items as BillingItem[])
      } catch (err) {
        console.error('Error loading invoice:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [woId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2196F3]" />
      </div>
    )
  }

  if (!wo || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#757575]">Invoice belum diterbitkan untuk Work Order ini.</p>
        <Link href={`/work-orders/${woId}/tagihan`} className="mt-4 inline-block text-xs text-[#2196F3] font-semibold">
          &larr; Kembali ke tagihan
        </Link>
      </div>
    )
  }

  const workshop = settings || {
    id: 1,
    nama: 'Bengkel Cemerlang Jaya Motor',
    alamat: 'Jl. Raya Otista No. 123, Jakarta Timur',
    telepon: '0812-3456-7890',
    jam_buka: 'Senin - Sabtu: 08:00 - 17:00',
    logo_path: null,
    galeri_paths: [],
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="space-y-6">
      {/* Action Bar (hidden on print) */}
      <div className="no-print flex items-center justify-between">
        <Link
          href={`/work-orders/${woId}/tagihan`}
          className="inline-flex items-center gap-1.5 text-xs text-[#757575] hover:text-[#212121] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Tagihan</span>
        </Link>

        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen Invoice (A4 / PDF)</span>
        </Button>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="bg-white border border-[#EAF2FA] rounded-[16px] shadow-sm max-w-4xl mx-auto p-10 print:border-none print:shadow-none print:p-0 print:m-0 text-black">
        {/* Header Bengkel & Invoice Info */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2196F3] text-white flex items-center justify-center font-bold text-xl print:border print:border-black">
              <Car className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">{workshop.nama}</h1>
              <p className="text-xs text-slate-600 max-w-sm mt-0.5">{workshop.alamat}</p>
              <p className="text-xs text-slate-600">Telepon / WhatsApp: {workshop.telepon}</p>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">INVOICE</h2>
            <p className="text-xs font-bold text-slate-800 mt-1">No: {invoice.nomor}</p>
            <p className="text-xs text-slate-600">Tanggal: {formatDate(invoice.diterbitkan_at)}</p>
            <p className="text-xs text-slate-600">No. WO: {wo.nomor}</p>
          </div>
        </div>

        {/* Info Pelanggan & Kendaraan */}
        <div className="grid grid-cols-2 gap-8 text-xs mb-8 pb-6 border-b border-slate-200">
          <div>
            <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ditagihkan Kepada:</p>
            <p className="text-sm font-bold text-slate-900">{wo.customers?.nama}</p>
            <p className="text-slate-600 mt-0.5">Telepon: {wo.customers?.telepon}</p>
            <p className="text-slate-600 mt-0.5">{wo.customers?.alamat || 'Alamat: -'}</p>
          </div>

          <div>
            <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Identitas Kendaraan:</p>
            <p className="text-sm font-bold text-slate-900">{wo.vehicles?.plat}</p>
            <p className="text-slate-700 font-medium">{wo.vehicles?.merek_model}</p>
            <p className="text-slate-600 mt-0.5">
              Tahun: {wo.vehicles?.tahun || '-'} &middot; Warna: {wo.vehicles?.warna || '-'} &middot; Odometer: {wo.odometer?.toLocaleString()} km
            </p>
          </div>
        </div>

        {/* Tabel Baris Tagihan (Clean & Professional, no cost info) */}
        <table className="w-full text-left text-xs mb-8">
          <thead>
            <tr className="border-b-2 border-slate-900 bg-slate-50">
              <th className="py-2.5 px-3 font-bold text-slate-900">No</th>
              <th className="py-2.5 px-3 font-bold text-slate-900">Uraian Servis & Spare Part</th>
              <th className="py-2.5 px-3 font-bold text-slate-900 text-center">Jenis</th>
              <th className="py-2.5 px-3 font-bold text-slate-900 text-center">Qty</th>
              <th className="py-2.5 px-3 font-bold text-slate-900 text-right">Harga Satuan</th>
              <th className="py-2.5 px-3 font-bold text-slate-900 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {billingItems.map((item, idx) => (
              <tr key={item.id}>
                <td className="py-2.5 px-3 text-slate-600">{idx + 1}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">{item.nama_item}</td>
                <td className="py-2.5 px-3 text-center uppercase text-[10px] text-slate-600 font-bold">
                  {item.jenis}
                </td>
                <td className="py-2.5 px-3 text-center">{item.jumlah}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{formatRupiah(item.harga_dipakai)}</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                  {formatRupiah(item.jumlah * item.harga_dipakai)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total & Status Pembayaran */}
        <div className="flex justify-between items-start pt-4 border-t-2 border-slate-900 text-xs mb-12">
          <div className="space-y-2">
            <div>
              <span className="font-bold text-slate-600 uppercase text-[10px]">Status Pembayaran:</span>
              <p
                className={`text-sm font-black uppercase mt-0.5 ${
                  invoice.status_bayar === 'lunas'
                    ? 'text-emerald-700'
                    : invoice.status_bayar === 'sebagian'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {invoice.status_bayar.replace('_', ' ')}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 italic max-w-xs">
              Terima kasih atas kepercayaan Anda mempercayakan perawatan kendaraan kepada kami.
            </p>
          </div>

          <div className="w-64 space-y-2 text-right">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold tabular-nums">{formatRupiah(invoice.subtotal)}</span>
            </div>
            {invoice.diskon > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Diskon:</span>
                <span className="font-semibold tabular-nums">- {formatRupiah(invoice.diskon)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
              <span>Total Tagihan:</span>
              <span className="tabular-nums">{formatRupiah(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sudah Dibayar:</span>
              <span className="font-semibold tabular-nums text-emerald-700">{formatRupiah(invoice.terbayar)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800">
              <span>Sisa Tagihan:</span>
              <span className="tabular-nums text-rose-700">{formatRupiah(invoice.total - invoice.terbayar)}</span>
            </div>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 text-center text-xs pt-8">
          <div>
            <p className="text-slate-600">Pelanggan,</p>
            <div className="h-16" />
            <p className="font-bold text-slate-900 border-t border-slate-300 inline-block px-8">
              {wo.customers?.nama}
            </p>
          </div>
          <div>
            <p className="text-slate-600">Kasir / Petugas Bengkel,</p>
            <div className="h-16" />
            <p className="font-bold text-slate-900 border-t border-slate-300 inline-block px-8">
              {workshop.nama}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
