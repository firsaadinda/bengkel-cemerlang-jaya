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

// Layanan populer dengan foto otomotif asli & natural dari Unsplash
const FEATURED_SERVICES = [
  {
    title: 'Ganti Oli & Tune Up Lengkap',
    desc: 'Penggantian oli sintetis berkualitas tinggi, filter oli, pembersihan throttle body, dan inspeksi 25 titik performa mesin.',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=700&q=80',
    tag: 'Servis Rutin',
    duration: '60 Menit',
  },
  {
    title: 'Sistem Pengereman & ABS',
    desc: 'Pembersihan caliper, penggantian kampas rem (brake pads), bubut piringan cakram, dan penggantian kuras minyak rem standar DOT-4.',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=700&q=80',
    tag: 'Keselamatan',
    duration: '45 Menit',
  },
  {
    title: 'Diagnosis Komputer & Scanner OBD-II',
    desc: 'Pemindaian sensor elektrikal, cek check engine light, reset sensor transmisi & ECU dengan scanner diagnostic terupdate.',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=700&q=80',
    tag: 'Elektrikal',
    duration: '30 Menit',
  },
  {
    title: 'Spooring, Balancing & Kaki-kaki',
    desc: 'Penyetelan sudut roda computer 3D, balancing rotasi ban, pengecekan tie rod, ball joint, dan shock absorber untuk kemudi stabil.',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=700&q=80',
    tag: 'Understeel',
    duration: '90 Menit',
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
    nama: 'Bengkel Cemerlang Jaya Motor',
    alamat: 'Jl. Raya Otista No. 123, Jakarta Timur',
    telepon: '0812-3456-7890',
    jam_buka: 'Senin - Sabtu: 08:00 - 17:00 (Minggu Libur)',
    logo_path: null,
    galeri_paths: [],
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Banner Bar */}
      <div className="bg-[#0F172A] text-slate-300 text-xs py-2 px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{workshop.jam_buka}</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>{workshop.alamat}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-40 Garansi" />
              <span className="text-emerald-400 font-medium">Garansi Servis 14 Hari</span>
            </span>
            <a
              href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              Emergency Call: {workshop.telepon}
            </a>
          </div>
        </div>
      </div>

      {/* Modern Header Navigation (Servz Inspired) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight leading-tight">
                  {workshop.nama}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 tracking-wide uppercase">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Spesialis Servis Mobil, Mesin & Kaki-Kaki</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#layanan" className="hover:text-blue-600 transition-colors">Layanan Servis</a>
            <a href="#keunggulan" className="hover:text-blue-600 transition-colors">Keunggulan Bengkel</a>
            <a href="#kontak" className="hover:text-blue-600 transition-colors">Lokasi & Kontak</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
            >
              <span>Portal Staf / Mekanik</span>
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Servz Automotive Style & Real Photo */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-12 pb-24 md:py-24">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Sistem Manajemen Servis Bengkel Modern Terpercaya</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Servis Mobil Presisi,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300">
                Transparan & Bergaransi.
              </span>
            </h2>

            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl font-normal">
              Rawat kendaraan kesayangan Anda dengan dukungan mekanik tersertifikasi, alat diagnostik digital mutakhir, serta suku cadang original dengan estimasi biaya transparan di muka.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}?text=Halo%20Bengkel%20Cemerlang%20Jaya,%20saya%20mau%20booking%20jadwal%20servis%20mobil`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.02]"
              >
                <CalendarCheck className="w-5 h-5" />
                <span>Booking Servis Sekarang</span>
              </a>

              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-sm transition-all backdrop-blur-sm"
              >
                <Gauge className="w-5 h-5 text-amber-400" />
                <span>Masuk Dashboard Internal</span>
              </Link>
            </div>

            {/* Highlight Badges / Stats (Servz aesthetic) */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800">
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-white">100%</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Suku Cadang Asli</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-blue-400">14 Hari</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Garansi Pengerjaan</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-amber-400">4.9 / 5.0</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Kepuasan Pelanggan</p>
              </div>
            </div>
          </div>

          {/* Hero Realistic Photography Card */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Background glow decoration */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 to-amber-500 opacity-30 blur-xl" />
              
              <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-800/90 shadow-2xl">
                {/* Natural, Authentic Photography: Modern workshop bay with car on lift & mechanic inspecting */}
                <div className="relative h-80 sm:h-96 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=1000&q=80"
                    alt="Mekanik profesional sedang memeriksa kendaraan di ruang servis modern"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                </div>

                {/* Floating Service Badge inside card */}
                <div className="p-6 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Layanan Unggulan</p>
                        <p className="text-sm font-bold text-white">General Checkup & Engine Flush</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Tersedia Hari Ini
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section (Servz Card Styling) */}
      <section id="layanan" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>KATEGORI PERAWATAN</span>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Layanan Bengkel Terpopuler
            </h3>
            <p className="text-slate-500 mt-2 text-sm md:text-base max-w-xl">
              Dikerjakan langsung oleh mekanik berpengalaman menggunakan SOP pengerjaan ketat dan transparansi nota digital.
            </p>
          </div>
          <a
            href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-700 group"
          >
            <span>Konsultasi Keluhan Mobil</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Grid Cards with Real Photos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_SERVICES.map((serv, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={serv.image}
                    alt={serv.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900/80 backdrop-blur-md text-white shadow-sm">
                      {serv.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 text-slate-800 shadow-sm flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      {serv.duration}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {serv.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {serv.desc}
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0">
                <a
                  href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}?text=Halo%20Bengkel%20Cemerlang%20Jaya,%20saya%20tertarik%20dengan%20layanan%20${encodeURIComponent(serv.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white font-semibold text-xs border border-slate-200 hover:border-transparent transition-all"
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
          <div className="mt-12 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Daftar Tarif Servis Terdaftar di Sistem</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dbServices.map((item: InventoryItem) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.nama}</p>
                    <p className="text-[11px] text-slate-500">{item.kode}</p>
                  </div>
                  <span className="text-xs font-extrabold text-blue-600">
                    {formatRupiah(item.harga_jual)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Why Choose Us / Workshop Highlights (Servz inspired) */}
      <section id="keunggulan" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kenapa Mempercayakan Kendaraan Anda di Bengkel Cemerlang Jaya?
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              Standar pelayanan transparan dengan pencatatan digital terintegrasi dari penerimaan hingga serah terima kendaraan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col items-start">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">Tim Mekanik Berpengalaman</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Setiap mekanik memiliki sertifikasi dan spesialisasi khusus pada mesin bensin, diesel, sistem kelistrikan, hingga kaki-kaki kendaraan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col items-start">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">Quality Control Berlapis</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sebelum kendaraan diserahkan ke pelanggan, Service Advisor dan Kepala Mekanik melakukan test drive dan checklist inspeksi 15 titik.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col items-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">Invoice Transparan & Bergaransi</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Rincian harga spare part dan ongkos jasa tercatat jelas tanpa biaya tersembunyi. Didukung jaminan garansi pengerjaan hingga 14 hari kerja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Location & Info Footer Bar */}
      <footer id="kontak" className="bg-[#0F172A] text-slate-300 pt-14 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Car className="w-5 h-5" />
              </div>
              <h4 className="text-white font-extrabold text-lg">{workshop.nama}</h4>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Solusi otomotif lengkap dan terpercaya di Jakarta. Melayani perawatan berkala, perbaikan darurat, overhaul mesin, kelistrikan AC, dan body detailing.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>WhatsApp Hotline</span>
              </a>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <span>Login Manajemen</span>
              </Link>
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Kontak & Lokasi</h5>
            <div className="space-y-3 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{workshop.alamat}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{workshop.telepon}</span>
              </p>
              <p className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{workshop.jam_buka}</span>
              </p>
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Navigasi Cepat</h5>
            <div className="space-y-2 text-xs">
              <p><a href="#layanan" className="hover:text-blue-400 transition-colors">Layanan & Servis Mobil</a></p>
              <p><a href="#keunggulan" className="hover:text-blue-400 transition-colors">Standar Bengkel & Mekanik</a></p>
              <p><Link href="/login" className="hover:text-blue-400 transition-colors">Akses Service Advisor (SA)</Link></p>
              <p><Link href="/login" className="hover:text-blue-400 transition-colors">Akses Kasir & Invoice</Link></p>
              <p><Link href="/login" className="hover:text-blue-400 transition-colors">Akses Owner & Laporan Laba</Link></p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} {workshop.nama}. Hak cipta dilindungi undang-undang.</p>
          <p className="text-[11px]">Sistem Terintegrasi Supabase Cloud Database & Next.js 15</p>
        </div>
      </footer>
    </div>
  )
}
