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
  Disc,
  Cpu,
  Sliders,
  DollarSign,
  Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InventoryItem, WorkshopSettings } from '@/types/database'
import { formatRupiah } from '@/lib/utils'

// Layanan servis mobil berfokus murni pada suku cadang & komponen mobil (tanpa foto orang/mekanik)
const FEATURED_SERVICES = [
  {
    title: 'Ganti Oli & Performa Mesin',
    desc: 'Penggantian oli mesin sintetis, filter oli baru, engine flush, serta pembersihan filter udara untuk menjaga kompresi mesin tetap optimal.',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
    tag: 'Servis Berkala',
    duration: '45 Menit',
  },
  {
    title: 'Piringan Cakram & Rem Caliper',
    desc: 'Pembersihan caliper, penggantian kampas rem (brake pads), bubut piringan cakram roda depan, dan flushing minyak rem DOT-4.',
    image: 'https://images.unsplash.com/photo-1762803942877-77462d9b9f55?auto=format&fit=crop&w=800&q=80',
    tag: 'Sistem Rem',
    duration: '40 Menit',
  },
  {
    title: 'Komputer Diagnostik OBD-II',
    desc: 'Scanning sistem sensor injeksi, deteksi sensor kelistrikan, reset check engine, dan pembacaan fault code transmisi otomatis.',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
    tag: 'Elektrikal',
    duration: '30 Menit',
  },
  {
    title: 'Spooring, Balancing & Roda Mobil',
    desc: 'Penyetelan sudut roda 3D (camber, caster, toe), rotasi ban, pengecekan tie rod, link stabilizer, dan ball joint roda depan.',
    image: 'https://images.unsplash.com/photo-1744223855103-b5516a34a497?auto=format&fit=crop&w=800&q=80',
    tag: 'Kaki-kaki Mobil',
    duration: '60 Menit',
  },
]

// 4 Fitur Highlight Banner (seperti 4 icon GearPro)
const HIGHLIGHT_FEATURES = [
  {
    icon: Cpu,
    title: 'Auto Diagnostics',
    desc: 'Deteksi komputer presisi untuk seluruh sensor elektrikal & ECU mobil.',
  },
  {
    icon: Disc,
    title: 'Genuine Materials',
    desc: 'Suku cadang dan oli mesin 100% original berstandar pabrikan.',
  },
  {
    icon: Wrench,
    title: 'Standard SOP',
    desc: 'Alur pengerjaan terstruktur dengan quality control sebelum serah terima.',
  },
  {
    icon: DollarSign,
    title: 'Low Cost Services',
    desc: 'Biaya transparan di awal tanpa ada tarif terselubung atau mark-up liar.',
  },
]

// Paket Servis (Pricing Plan ala GearPro)
const PRICING_PACKAGES = [
  {
    name: 'Paket Servis Ringan',
    price: 'Rp 350.000',
    desc: 'Perawatan rutin berkala setiap 5.000 - 10.000 KM.',
    features: [
      'Ganti Oli Mesin & Filter Oli',
      'Pembersihan Saringan Udara',
      'Pemeriksaan Sistem Rem 4 Roda',
      'Cek Fluida & Aki Kendaraan',
      'General Checkup 15 Titik Mobil',
    ],
    popular: false,
  },
  {
    name: 'Paket Tune Up & Rem Komplit',
    price: 'Rp 750.000',
    desc: 'Pembersihan ruang bakar mesin dan optimalisasi pengereman.',
    features: [
      'Semua di Paket Servis Ringan',
      'Pembersihan Throttle Body & Busi',
      'Carbon Cleaner Ruang Bakar',
      'Flushing Minyak Rem DOT-4',
      'Scanner Komputer Diagnostik OBD-II',
      'Garansi Pengerjaan 14 Hari',
    ],
    popular: true,
  },
  {
    name: 'Paket Kaki-kaki & Spooring',
    price: 'Rp 600.000',
    desc: 'Stabilisasi kemudi dan kenyamanan berkendara roda mobil.',
    features: [
      'Spooring 3D Komputer Roda Depan',
      'Finish Balancing 4 Roda',
      'Pengecekan Tie Rod & Rack End',
      'Inspeksi Shock Absorber & Bushing',
      'Uji Kelayakan Jalan (Test Drive)',
    ],
    popular: false,
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
    nama: 'CEMERLANG JAYA',
    alamat: 'Jl. Raya Otista No. 123, Jakarta Timur',
    telepon: '0812-3456-7890',
    jam_buka: 'Senin - Sabtu: 08:00 - 17:00 (Minggu Libur)',
    logo_path: null,
    galeri_paths: [],
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between selection:bg-rose-700 selection:text-white">
      {/* Top Banner Bar: Dark Slate with Amber Yellow Highlight */}
      <div className="bg-[#1C1917] text-stone-300 text-xs py-2.5 px-6 border-b border-stone-800">
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
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                100% Result Guarantee
              </span>
            </span>
            <a
              href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-bold"
            >
              Hotline: {workshop.telepon}
            </a>
          </div>
        </div>
      </div>

      {/* Header Navigation (GearPro Inspired Brand Layout) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Bengkel */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-950/20 ring-2 ring-amber-400/40">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-stone-900 text-lg md:text-xl tracking-tight leading-none uppercase">
                  {workshop.nama}
                </h1>
              </div>
              <p className="text-[11px] text-stone-500 font-semibold uppercase tracking-wider mt-0.5">
                Car Repair & Auto Service
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-bold text-stone-600">
            <a href="#tentang" className="hover:text-rose-700 transition-colors">About Us</a>
            <a href="#layanan" className="hover:text-rose-700 transition-colors">Services</a>
            <a href="#paket" className="hover:text-rose-700 transition-colors">Pricing Plan</a>
            <a href="#kontak" className="hover:text-rose-700 transition-colors">Contact</a>
          </nav>

          {/* Quick Contact & Login Button */}
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>{workshop.telepon}</span>
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              <span>Portal Masuk</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION: GearPro Big Banner Style with User's Uploaded Engine Repair Photo */}
      <section className="relative bg-[#0F0D0C] text-white overflow-hidden">
        {/* User uploaded natural mechanic repair photo as background */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-mechanic-repair.jpg"
            alt="Perbaikan mesin mobil oleh mekanik profesional"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Rich multi-stop dark gradient overlay with warm amber & rose depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0D0CEE] via-[#141211DD] to-[#1C191777]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0D0C] via-transparent to-[#0F0D0C99]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-32 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-8 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/80 border border-amber-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-extrabold text-[11px] uppercase tracking-[0.2em]">
                Quality Service • Auto Repair
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-wide leading-[1.12] uppercase font-sans">
              REPAIR WITH CARE FOR{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 underline decoration-rose-600 decoration-4 underline-offset-8">
                YOUR CAR
              </span>
            </h2>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal pt-1">
              Spesialis perawatan dan perbaikan suku cadang mobil: mesin, kampas & piringan cakram rem, spooring balancing roda depan, serta diagnosis sensor kelistrikan secara transparan dan bergaransi.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}?text=Halo%20Bengkel%20Cemerlang%20Jaya,%20saya%20mau%20booking%20jadwal%20servis%20mobil`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20 hover:scale-[1.02]"
              >
                <CalendarCheck className="w-4 h-4 text-stone-950" />
                <span>Booking Servis Mobil</span>
              </a>

              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-stone-900/90 hover:bg-rose-700 text-white border border-stone-700 font-bold text-xs uppercase tracking-wider transition-all backdrop-blur-sm"
              >
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Masuk Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Feature Columns Bar (Seperti bar 4 icon GearPro di bawah hero) */}
        <div className="relative z-20 border-t border-stone-800 bg-[#0F0D0C]/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HIGHLIGHT_FEATURES.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-xl hover:bg-stone-900/60 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/20">
                    <Icon className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ABOUT / COMMITTED SECTION (Layout 2 Kolom ala GearPro: Foto Komponen Mobil di Kiri, Teks Komitmen di Kanan) */}
      <section id="tentang" className="py-20 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Kolom Kiri: 2 Foto Komponen Mobil (Roda depan & Piringan Cakram Rem, tanpa orang) */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="relative h-72 rounded-2xl overflow-hidden border border-stone-200 shadow-md bg-stone-900">
              <Image
                src="https://images.unsplash.com/photo-1762803942877-77462d9b9f55?auto=format&fit=crop&w=700&q=80"
                alt="Close-up roda depan dan piringan rem cakram mobil"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-stone-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300">
                Pengereman Roda
              </div>
            </div>

            <div className="relative h-72 rounded-2xl overflow-hidden border border-stone-200 shadow-md bg-stone-900 mt-8">
              <Image
                src="https://images.unsplash.com/photo-1744223855103-b5516a34a497?auto=format&fit=crop&w=700&q=80"
                alt="Inspeksi velg dan roda mobil harian"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-stone-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300">
                Spooring & Balancing
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Teks Komitmen */}
          <div className="lg:col-span-6 space-y-5">
            <span className="text-amber-600 font-extrabold text-xs uppercase tracking-widest block">
              About Our Workshop
            </span>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight leading-tight uppercase">
              Committed To Give High Quality Repairing & Services
            </h3>

            <p className="text-sm text-stone-600 leading-relaxed">
              Bengkel Cemerlang Jaya hadir memberikan solusi pemeliharaan kendaraan roda empat secara presisi. Mulai dari pengecekan pelumasan mesin, sistem pengereman, transmisi, hingga geometri roda demi keamanan dan kenyamanan berkendara Anda sekeluarga.
            </p>

            {/* Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-xs font-black">
                  ✓
                </div>
                <span className="text-xs font-bold text-stone-800">100% Suku Cadang Original & Terdaftar</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-xs font-black">
                  ✓
                </div>
                <span className="text-xs font-bold text-stone-800">Checklist Quality Control 15 Titik Kendaraan</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-xs font-black">
                  ✓
                </div>
                <span className="text-xs font-bold text-stone-800">Nota Tagihan Digital Transparan Tanpa Biaya Siluman</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-xs font-black">
                  ✓
                </div>
                <span className="text-xs font-bold text-stone-800">Garansi Pengerjaan Servis 14 Hari Kerja</span>
              </div>
            </div>

            <div className="pt-3">
              <a
                href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                <span>Konsultasikan Masalah Mobil</span>
                <ChevronRight className="w-4 h-4 text-amber-300" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES GRID SECTION: Foto Roda & Bagian Mobil (Tanpa Foto Orang) */}
      <section id="layanan" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-amber-600 font-extrabold text-xs uppercase tracking-widest block mb-2">
            Our Specialties
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight uppercase">
            Layanan Servis Komponen Mobil
          </h3>
          <p className="text-stone-500 text-xs sm:text-sm mt-2">
            Penanganan terarah pada setiap komponen mobil menggunakan peralatan diagnostik dan standar kerja ketat.
          </p>
        </div>

        {/* 4 Cards Komponen Mobil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_SERVICES.map((serv, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 group"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-stone-900">
                  <Image
                    src={serv.image}
                    alt={serv.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-stone-900/90 text-amber-400 uppercase tracking-wider shadow-sm">
                      {serv.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-stone-900 shadow-sm flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-700" />
                      {serv.duration}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="font-extrabold text-stone-900 text-base group-hover:text-rose-700 transition-colors uppercase">
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
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-50 hover:bg-rose-700 text-stone-700 hover:text-white font-bold text-xs uppercase tracking-wider border border-stone-200 hover:border-transparent transition-all"
                >
                  <span>Pesan Servis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Database Registered Services */}
        {dbServices && dbServices.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Daftar Ongkos Jasa Servis Terdaftar di Sistem</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dbServices.map((item: InventoryItem) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-stone-800">{item.nama}</p>
                    <p className="text-[11px] text-stone-500">{item.kode}</p>
                  </div>
                  <span className="text-xs font-black text-rose-700">
                    {formatRupiah(item.harga_jual)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* PRICING PLAN SECTION (Seperti Kotak Gelap GearPro di kanan atas gambar) */}
      <section id="paket" className="py-20 bg-[#1C1917] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-amber-400 font-extrabold text-xs uppercase tracking-widest block mb-2">
              Affordable Rates
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              Paket Perawatan Kendaraan
            </h3>
            <p className="text-stone-400 text-xs sm:text-sm mt-2">
              Pilihan paket servis terjangkau dengan cakupan pemeriksaan menyeluruh dan garansi pengerjaan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_PACKAGES.map((pkg, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all ${
                  pkg.popular
                    ? 'bg-[#292524] border-2 border-amber-400 shadow-2xl scale-105'
                    : 'bg-[#201D1B] border border-stone-800'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-stone-950 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Paling Diminati
                  </div>
                )}

                <div>
                  <h4 className="font-extrabold text-white text-lg uppercase">{pkg.name}</h4>
                  <p className="text-xs text-stone-400 mt-1">{pkg.desc}</p>
                  <div className="my-6">
                    <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                      {pkg.price}
                    </span>
                    <span className="text-xs text-stone-400 block mt-1">Estimasi biaya jasa & tune up</span>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-stone-800">
                    {pkg.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-stone-300">
                        <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <a
                    href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}?text=Halo%20Bengkel%20Cemerlang%20Jaya,%20saya%20mau%20ambil%20paket%20${encodeURIComponent(pkg.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                      pkg.popular
                        ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-lg shadow-amber-400/20'
                        : 'bg-rose-700 hover:bg-rose-800 text-white'
                    }`}
                  >
                    <span>Pilih Paket Ini</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER (Dark Slate & Amber Yellow ala GearPro) */}
      <footer id="kontak" className="bg-[#141211] text-stone-300 pt-16 pb-8 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-700 flex items-center justify-center text-white ring-2 ring-amber-400/40">
                <Car className="w-5 h-5" />
              </div>
              <h4 className="text-white font-black text-lg tracking-tight uppercase">
                {workshop.nama}
              </h4>
            </div>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              Bengkel perbaikan dan servis mobil harian di Jakarta. Spesialis tune up mesin, sistem rem cakram, spooring balancing roda, dan diagnosis kelistrikan mobil tanpa biaya siluman.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`https://wa.me/${workshop.telepon.replace(/[^0-9]/g, '')}`}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-stone-950" />
                <span>WhatsApp Hotline</span>
              </a>
              <Link
                href="/login"
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-rose-700 text-stone-200 font-bold text-xs uppercase tracking-wider border border-stone-700 transition-colors"
              >
                <span>Portal Masuk Karyawan</span>
              </Link>
            </div>
          </div>

          <div>
            <h5 className="text-white font-extrabold text-xs uppercase tracking-widest mb-4">
              Location & Hours
            </h5>
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
            <h5 className="text-white font-extrabold text-xs uppercase tracking-widest mb-4">
              Quick Portals
            </h5>
            <div className="space-y-2 text-xs">
              <p><Link href="/login" className="hover:text-amber-400 transition-colors">Service Advisor (Work Order Mobil)</Link></p>
              <p><Link href="/login" className="hover:text-amber-400 transition-colors">Kepala Mekanik (Alokasi Tim)</Link></p>
              <p><Link href="/login" className="hover:text-amber-400 transition-colors">Kasir (Pembayaran & Invoice)</Link></p>
              <p><Link href="/login" className="hover:text-amber-400 transition-colors">Owner (Laporan Laba & Audit)</Link></p>
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
