import React from 'react'
import Link from 'next/link'
import { Car, Clock, MapPin, Phone, ShieldCheck, Wrench, CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InventoryItem, WorkshopSettings } from '@/types/database'

export default async function HomePage() {
  const supabase = await createClient()

  // Ambil pengaturan bengkel
  const { data: settings } = await supabase
    .from('workshop_settings')
    .select('*')
    .eq('id', 1)
    .single()

  // Ambil maksimal 8 jasa aktif
  const { data: services } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('jenis', 'jasa')
    .eq('aktif', true)
    .order('created_at', { ascending: true })
    .limit(8)

  const workshop: WorkshopSettings = settings || {
    id: 1,
    nama: 'Bengkel Cemerlang Jaya Motor',
    alamat: 'Jl. Raya Otista No. 123, Jakarta Timur',
    telepon: '0812-3456-7890',
    jam_buka: 'Senin - Sabtu: 08:00 - 17:00 (Minggu Tutup)',
    logo_path: null,
    galeri_paths: [],
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-[#F2F9FE] flex flex-col justify-between">
      {/* Header Publik */}
      <header className="bg-white border-b border-[#EAF2FA] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#2196F3] flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base text-[#212121] leading-tight">{workshop.nama}</h1>
              <p className="text-xs text-[#757575]">Solusi Perawatan & Perbaikan Mobil Terpercaya</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#2196F3] text-white text-sm font-medium hover:bg-[#1976D2] transition-colors shadow-sm"
            >
              <span>Masuk Sistem</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 text-center max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCEBFB] text-[#1976D2] mb-4">
          <ShieldCheck className="w-4 h-4" /> Bengkel Resmi & Berpengalaman
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-[#212121] tracking-tight leading-tight">
          Perawatan Mobil Profesional dengan Standar Kerja Terstandarisasi
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#4A5565] max-w-2xl mx-auto">
          Melayani servis berkala, perbaikan mesin, kelistrikan, sistem rem, dan perawatan AC oleh tim mekanik handal bergaransi.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#2E7D32] text-white font-medium hover:bg-[#1b5e20] transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Hubungi via WhatsApp</span>
          </a>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white border border-[#EAF2FA] text-[#212121] font-medium hover:bg-[#F2F9FE] transition-colors"
          >
            <span>Portal Karyawan</span>
          </Link>
        </div>
      </section>

      {/* Bengkel Info Cards */}
      <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white p-6 rounded-[14px] border border-[#EAF2FA] shadow-xs flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-[#1976D2] shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#212121] mb-1">Alamat Bengkel</h3>
            <p className="text-xs text-[#4A5565] leading-relaxed">{workshop.alamat}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[14px] border border-[#EAF2FA] shadow-xs flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-[#F59E0B] shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#212121] mb-1">Jam Operasional</h3>
            <p className="text-xs text-[#4A5565] leading-relaxed">{workshop.jam_buka}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[14px] border border-[#EAF2FA] shadow-xs flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-[#2E7D32] shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#212121] mb-1">Kontak & Reservasi</h3>
            <p className="text-xs text-[#4A5565] leading-relaxed">{workshop.telepon}</p>
          </div>
        </div>
      </section>

      {/* Layanan Unggulan */}
      <section className="bg-white border-y border-[#EAF2FA] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h3 className="text-2xl font-bold text-[#212121]">Layanan & Perawatan Mobil</h3>
            <p className="text-sm text-[#757575] mt-2">
              Berbagai paket servis komprehensif untuk menjaga performa optimal kendaraan Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {(services as InventoryItem[] || []).map((srv) => (
              <div
                key={srv.id}
                className="p-5 rounded-[12px] bg-[#F2F9FE] border border-[#EAF2FA] hover:border-blue-300 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#DCEBFB] text-[#1976D2] flex items-center justify-center mb-3">
                  <Wrench className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm text-[#212121]">{srv.nama}</h4>
                <p className="text-xs text-[#757575] mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Teknisi Berpengalaman</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeri Bengkel */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h3 className="text-2xl font-bold text-[#212121]">Fasilitas & Suasana Bengkel</h3>
          <p className="text-sm text-[#757575] mt-2">Ruang servis berstandar dengan peralatan modern dan ruang tunggu nyaman.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="h-48 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-[#EAF2FA] flex flex-col items-center justify-center p-4 text-center">
            <Car className="w-12 h-12 text-[#2196F3] mb-2 opacity-80" />
            <p className="text-xs font-semibold text-[#1976D2]">Area Service Bay & Lift</p>
            <p className="text-[11px] text-[#757575]">Kapasitas pengerjaan simultan multi-kendaraan</p>
          </div>
          <div className="h-48 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 border border-[#EAF2FA] flex flex-col items-center justify-center p-4 text-center">
            <Wrench className="w-12 h-12 text-[#2196F3] mb-2 opacity-80" />
            <p className="text-xs font-semibold text-[#1976D2]">Peralatan Diagnostik Modern</p>
            <p className="text-[11px] text-[#757575]">Scanner OBD-II dan peralatan presisi</p>
          </div>
          <div className="h-48 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 border border-[#EAF2FA] flex flex-col items-center justify-center p-4 text-center">
            <ShieldCheck className="w-12 h-12 text-[#2196F3] mb-2 opacity-80" />
            <p className="text-xs font-semibold text-[#1976D2]">Gudang Spare Part Asli</p>
            <p className="text-[11px] text-[#757575]">Komponen terjamin mutu & garansi</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#EAF2FA] py-8 text-center text-xs text-[#757575]">
        <p>&copy; {new Date().getFullYear()} {workshop.nama}. Hak cipta dilindungi.</p>
      </footer>
    </div>
  )
}
