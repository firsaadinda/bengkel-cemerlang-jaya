import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Car,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Wrench,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Award,
  Users,
  Gauge,
  CalendarCheck,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InventoryItem, WorkshopSettings } from '@/types/database'
import { formatRupiah } from '@/lib/utils'

// Layanan servis mobil umum (bukan mobil mewah/BMW, fokus pada perawatan mobil harian)
const FEATURED_SERVICES = [
  {
    title: 'Ganti Oli Mesin & Tune Up Harian',
    desc: 'Penggantian oli mesin berkualitas, filter oli, pembersihan saringan udara, dan general checkup performa mesin mobil keluarga.',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
    tag: 'Servis Berkala',
    duration: '45 Menit',
  },
  {
    title: 'Servis Sistem Rem & Kampas Rem',
    desc: 'Pembersihan caliper, penggantian kampas rem (brake pads), bubut piringan cakram roda depan, dan cek kebocoran minyak rem.',
    image: 'https://images.unsplash.com/photo-1762803942877-77462d9b9f55?auto=format&fit=crop&w=800&q=80',
    tag: 'Keselamatan',
    duration: '40 Menit',
  },
  {
    title: 'Diagnosis Sensor & Kelistrikan Mobil',
    desc: 'Pengecekan scanner komputer OBD-II untuk lampu indikator check engine, aki, alternator, dan kelistrikan lampu mobil.',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
    tag: 'Elektrikal',
    duration: '30 Menit',
  },
  {
    title: 'Rotasi Ban, Spooring & Balancing Roda',
    desc: 'Penyetelan sudut roda depan 3D, balancing getaran roda, serta pengecekan tierod dan bushing kaki-kaki mobil agar stir lurus stabil.',
    image: 'https://images.unsplash.com/photo-1744223855103-b5516a34a497?auto=format&fit=crop&w=800&q=80',
    tag: 'Kaki-kaki Mobil',
    duration: '60 Menit',
  },
]

export default async function HomePage() {
  const supabase = await createClient()

  // Ambil pengaturan bengkel
  const { data: settings } = await supabase
    .from('workshop_settings')
    .select('*')
    .eq('id', 1)
    .single()

  // Ambil data layanan aktif dari database
  const { data: dbServices } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('jenis', 'jasa')
    .eq('aktif', true)
    .order('created_at', { ascending: true })
    .limit(8)

  const workshop: WorkshopSettings = settings || {
    id: 1,
    nama: 'Bengkel Cemerlang Jaya',
    alamat: 'Jl. Raya Otista No. 123, Jakarta Timur',
    telepon: '0812-3456-7890',
    jam_buka: 'Senin - Sabtu: 08:00 - 17:00 (Minggu Libur)',
    logo_path: null,
    galeri_paths: [],
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between selection:bg-rose-700 selection:text-white">
      {/* Top Banner Bar - Warm Dark Slate with Amber Yellow */}
      <div className="bg-[#1C1917] text-stone-300 text-xs py-2 px-6 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{workshop.jam_buka}</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{workshop.alamat}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-semibold">Garansi Servis Mobil 14 Hari</span>
            </span>
            <a
              href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-bold"
            >
              Hotline Bengkel: {workshop.telepon}
            </a>
          </div>
        </div>
      </div>

      {/* Header Navigation - Clean Warm Red & Amber Accents */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-700 to-rose-900 flex items-center justify-center text-white shadow-md shadow-rose-900/20 ring-2 ring-amber-400/30">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-stone-900 text-base md:text-lg tracking-tight leading-tight">
                  {workshop.nama}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300/60 uppercase tracking-wide">
                  Spesialis Mobil
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">Servis Mobil Harian & Perawatan Kaki-Kaki</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600">
            <a href="#layanan" className="hover:text-rose-700 transition-colors">Layanan Servis Mobil</a>
            <a href="#keunggulan" className="hover:text-rose-700 transition-colors">Keunggulan Bengkel</a>
            <a href="#kontak" className="hover:text-rose-700 transition-colors">Lokasi & Kontak</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-white text-sm font-bold transition-all shadow-sm"
            >
              <span>Portal Karyawan</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Warm Red, Amber, and Wheel/Tire Focus (No luxury brand badge) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900 to-stone-800 text-white pt-12 pb-24 md:py-24">
        {/* Subtle dot pattern with warm amber/rose tone */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Perawatan Mobil Terpercaya & Ramah di Kantong</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Servis Mobil Berkala,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-amber-400">
                Transparan & Nyaman.
              </span>
            </h2>

            <p className="text-stone-300 text-base md:text-lg leading-relaxed max-w-2xl font-normal">
              Perawatan mobil harian Anda ditangani dengan teliti: ganti oli mesin, perbaikan kampas & cakram rem, spooring balancing roda depan, tune up, dan kelistrikan mobil tanpa biaya tersembunyi.
            </p>

            {/* Quick Action Buttons (Warm Red & Amber Highlight) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}?text=Halo%20Bengkel%20Cemerlang%20Jaya,%20saya%20mau%20booking%20jadwal%20servis%20mobil`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm transition-all shadow-lg shadow-rose-950/50 hover:scale-[1.02]"
              >
                <CalendarCheck className="w-5 h-5 text-amber-300" />
                <span>Booking Servis Mobil</span>
              </a>

              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 border border-stone-700 font-semibold text-sm transition-all backdrop-blur-sm"
              >
                <Gauge className="w-5 h-5 text-amber-400" />
                <span>Masuk Dashboard Internal</span>
              </Link>
            </div>

            {/* Highlight Badges / Stats (Servz warm red & amber aesthetic) */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-800">
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-white">100%</p>
                <p className="text-xs text-stone-400 font-medium mt-0.5">Suku Cadang Asli</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-rose-400">14 Hari</p>
                <p className="text-xs text-stone-400 font-medium mt-0.5">Garansi Pengerjaan</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-amber-400">4.9 / 5.0</p>
                <p className="text-xs text-stone-400 font-medium mt-0.5">Kepuasan Pelanggan</p>
              </div>
            </div>
          </div>

          {/* Hero Card: Roda Mobil Depan & Cakram Rem (Natural, Tanpa Brand Mewah/BMW) */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Warm glow */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-rose-800 to-amber-600 opacity-25 blur-xl" />
              
              <div className="relative rounded-3xl overflow-hidden border border-stone-700/80 bg-stone-800 shadow-2xl">
                {/* Authentic Roda Depan & Caliper Rem Mobil */}
                <div className="relative h-80 sm:h-96 w-full bg-stone-950">
                  <Image
                    src="https://images.unsplash.com/photo-1762803942877-77462d9b9f55?auto=format&fit=crop&w=1000&q=80"
                    alt="Pemeriksaan roda depan dan piringan rem cakram mobil"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-transparent" />
                </div>

                {/* Floating Service Badge inside card */}
                <div className="p-6 bg-stone-900/95 backdrop-blur-md border-t border-stone-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 font-medium">Layanan Perawatan</p>
                        <p className="text-sm font-bold text-white">Inspeksi Roda & Pengereman Mobil</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Buka Hari Ini
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section (Warm Red & Amber Styling) */}
      <section id="layanan" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>PERAWATAN MOBIL HARIAN</span>
            </div>
            <h3 className="text-3xl font-extrabold text-stone-900 tracking-tight">
              Layanan Bengkel Mobil Terpopuler
            </h3>
            <p className="text-stone-500 mt-2 text-sm md:text-base max-w-xl">
              Dikerjakan langsung oleh mekanik berpengalaman dengan pengerjaan terstandarisasi dan rincian biaya yang transparan.
            </p>
          </div>
          <a
            href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-rose-700 font-bold text-sm hover:text-rose-800 group"
          >
            <span>Konsultasi Keluhan Mobil</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Grid Cards with Real Photos (Mobil, Roda, Mesin, Rem) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_SERVICES.map((serv, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                  <Image
                    src={serv.image}
                    alt={serv.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-900/80 backdrop-blur-md text-white shadow-sm">
                      {serv.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/95 text-stone-800 shadow-sm flex items-center gap-1 border border-stone-200">
                      <Clock className="w-3 h-3 text-amber-600" />
                      {serv.duration}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-stone-900 text-base group-hover:text-rose-700 transition-colors">
                    {serv.title}
                  </h4>
                  <p className="text-xs text-stone-500 mt-2 line-clamp-3 leading-relaxed">
                    {serv.desc}
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0">
                <a
                  href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}?text=Halo%20Bengkel%20Cemerlang%20Jaya,%20saya%20tertarik%20dengan%20layanan%20${encodeURIComponent(serv.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-50 hover:bg-rose-700 text-stone-700 hover:text-white font-semibold text-xs border border-stone-200 hover:border-transparent transition-all"
                >
                  <span>Pesan Layanan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* List of active database services if available */}
        {dbServices && dbServices.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Daftar Tarif Servis Terdaftar di Sistem</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dbServices.map((item: InventoryItem) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-stone-800">{item.nama}</p>
                    <p className="text-[11px] text-stone-500">{item.kode}</p>
                  </div>
                  <span className="text-xs font-extrabold text-rose-700">
                    {formatRupiah(item.harga_jual)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section id="keunggulan" className="py-16 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h3 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">
              Kenapa Mempercayakan Mobil Anda di Bengkel Cemerlang Jaya?
            </h3>
            <p className="text-stone-500 text-sm mt-2">
              Pelayanan ramah, standar kerja terstruktur, dan estimasi biaya jelas sebelum pengerjaan dimulai.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-stone-200 flex flex-col items-start">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-900 text-lg mb-2">Tim Mekanik Handal & Teliti</h4>
              <p className="text-sm text-stone-600 leading-relaxed">
                Mekanik kami berpengalaman menangani mobil harian keluarga, MPV, city car, hingga kendaraan komersial ringan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-stone-200 flex flex-col items-start">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-900 text-lg mb-2">Pemeriksaan & Uji Kelayakan</h4>
              <p className="text-sm text-stone-600 leading-relaxed">
                Sebelum diserahkan kembali, mobil dicek bersama checklist Service Advisor untuk memastikan keluhan telah tuntas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-stone-200 flex flex-col items-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-900 text-lg mb-2">Garansi Servis & Biaya Jelas</h4>
              <p className="text-sm text-stone-600 leading-relaxed">
                Rincian harga suku cadang dan ongkos kerja tercetak jelas di nota invoice digital dengan garansi pengerjaan 14 hari.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Location & Info Footer Bar */}
      <footer id="kontak" className="bg-[#1C1917] text-stone-300 pt-14 pb-8 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-700 flex items-center justify-center text-white ring-2 ring-amber-400/20">
                <Car className="w-5 h-5" />
              </div>
              <h4 className="text-white font-extrabold text-lg">{workshop.nama}</h4>
            </div>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              Bengkel perawatan dan servis mobil harian di Jakarta. Melayani tune up mesin, ganti oli, servis rem cakram, perbaikan kaki-kaki, dan kelistrikan mobil.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>WhatsApp Hotline</span>
              </a>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 transition-colors"
              >
                <span>Login Karyawan</span>
              </Link>
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Kontak & Lokasi</h5>
            <div className="space-y-3 text-xs text-stone-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{workshop.alamat}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{workshop.telepon}</span>
              </p>
              <p className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{workshop.jam_buka}</span>
              </p>
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Akses Masuk Karyawan</h5>
            <div className="space-y-2 text-xs">
              <p><Link href="/login" className="hover:text-amber-400 transition-colors">Akses Service Advisor (WO Mobil)</Link></p>
              <p><Link href="/login" className="hover:text-amber-400 transition-colors">Akses Kepala Mekanik (Tim Kerja)</Link></p>
              <p><Link href="/login" className="hover:text-amber-400 transition-colors">Akses Kasir (Pembayaran & Invoice)</Link></p>
              <p><Link href="/login" className="hover:text-amber-400 transition-colors">Akses Owner (Laporan Laba & Audit)</Link></p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} {workshop.nama}. Hak cipta dilindungi.</p>
          <p className="text-[11px]">Sistem Terintegrasi Supabase Cloud Database & Next.js 15</p>
        </div>
      </footer>
    </div>
  )
}
