'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Car, Lock, Mail, AlertCircle, ArrowLeft, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') || '/dashboard'
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState(
    errorParam === 'nonaktif'
      ? 'Akunmu dinonaktifkan. Hubungi Owner.'
      : errorParam === 'unauthorized'
      ? 'Halaman ini tidak tersedia untuk peranmu.'
      : ''
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg('Email atau kata sandi salah. Silakan periksa kembali.')
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setErrorMsg('Gagal memverifikasi pengguna.')
        setIsLoading(false)
        return
      }

      // Periksa status aktif di profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('aktif, role')
        .eq('id', data.user.id)
        .single()

      if (!profile || !profile.aktif) {
        await supabase.auth.signOut()
        setErrorMsg('Akunmu dinonaktifkan. Hubungi Owner Bengkel.')
        setIsLoading(false)
        return
      }

      router.push(nextUrl)
      router.refresh()
    } catch {
      setErrorMsg('Terjadi kesalahan saat masuk. Coba lagi.')
      setIsLoading(false)
    }
  }

  const fillQuickAccount = (quickEmail: string) => {
    setEmail(quickEmail)
    setPassword('Bengkel123!')
    setErrorMsg('')
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container Card with 2-Column Warm Red & Amber Aesthetic */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-stone-800">
        
        {/* Left Column: Visual Roda Mobil Depan & Kampas Rem (Tanpa Merek Mewah) */}
        <div className="hidden lg:flex lg:col-span-5 bg-stone-900 text-white p-10 flex-col justify-between relative overflow-hidden">
          {/* Natural photo background: Roda mobil & piringan cakram rem */}
          <div className="absolute inset-0 opacity-30">
            <Image
              src="https://images.unsplash.com/photo-1762803942877-77462d9b9f55?auto=format&fit=crop&w=800&q=80"
              alt="Pemeriksaan roda mobil dan sistem rem"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-stone-900/40" />
          </div>

          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-300 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-stone-800/80 border border-stone-700/60 backdrop-blur-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Kembali ke Website</span>
            </Link>

            <div className="mt-12">
              <div className="w-12 h-12 rounded-2xl bg-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-950/40 mb-4 ring-2 ring-amber-400/40">
                <Car className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Bengkel Cemerlang Jaya
              </h2>
              <p className="text-xs text-amber-300 mt-1 font-semibold uppercase tracking-wider">
                Spesialis Bengkel Mobil
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4 pt-10 border-t border-stone-800">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-md bg-rose-500/20 text-rose-300 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs text-stone-300 font-medium leading-relaxed">
                Pencatatan Work Order digital dan tracking progres pengerjaan mobil harian.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-md bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs text-stone-300 font-medium leading-relaxed">
                Stok sparepart otomatis terpotong saat mobil dikerjakan (metode FIFO).
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs text-stone-300 font-medium leading-relaxed">
                Laporan laba kotor, invoice otomatis, dan QC test drive terstandarisasi.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Login Form & Demo Credentials */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between lg:hidden mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Beranda</span>
              </Link>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                Spesialis Mobil
              </span>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                Portal Masuk Karyawan
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Silakan masuk dengan kredensial staf atau klik salah satu akun demo di bawah.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@bengkel.com"
                    className="pl-10 text-xs sm:text-sm h-11 rounded-xl border-stone-200 focus:border-rose-700 focus:ring-rose-700"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    Kata Sandi
                  </label>
                  <span className="text-[11px] text-stone-400">Default: Bengkel123!</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 text-xs sm:text-sm h-11 rounded-xl border-stone-200 focus:border-rose-700 focus:ring-rose-700"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm shadow-md shadow-rose-900/20 transition-all mt-2"
              >
                {isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
              </Button>
            </form>
          </div>

          {/* Quick Demo Login Buttons */}
          <div className="mt-8 pt-6 border-t border-stone-100">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2.5">
              Akses Cepat Demo (Klik untuk Isi Otomatis)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccount('owner@bengkel.com')}
                className="text-left p-2.5 rounded-xl border border-stone-200 hover:border-rose-700 hover:bg-rose-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 group-hover:text-rose-800">Owner</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full font-bold">Lengkap</span>
                </div>
                <span className="text-[10px] text-stone-400 block truncate mt-0.5">owner@bengkel.com</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('sa@bengkel.com')}
                className="text-left p-2.5 rounded-xl border border-stone-200 hover:border-rose-700 hover:bg-rose-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 group-hover:text-rose-800">Service Advisor</span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded-full font-bold">WO & QC</span>
                </div>
                <span className="text-[10px] text-stone-400 block truncate mt-0.5">sa@bengkel.com</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('kasir@bengkel.com')}
                className="text-left p-2.5 rounded-xl border border-stone-200 hover:border-rose-700 hover:bg-rose-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 group-hover:text-rose-800">Kasir</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold">Bayar</span>
                </div>
                <span className="text-[10px] text-stone-400 block truncate mt-0.5">kasir@bengkel.com</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('kepala@bengkel.com')}
                className="text-left p-2.5 rounded-xl border border-stone-200 hover:border-rose-700 hover:bg-rose-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 group-hover:text-rose-800">Kepala Mekanik</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full font-bold">Tim</span>
                </div>
                <span className="text-[10px] text-stone-400 block truncate mt-0.5">kepala@bengkel.com</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-900 flex items-center justify-center text-white text-xs">Memuat halaman login...</div>}>
      <LoginForm />
    </Suspense>
  )
}
