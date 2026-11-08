'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Car, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react'
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
        setErrorMsg('Email atau kata sandi salah')
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setErrorMsg('Gagal memverifikasi pengguna')
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
        setErrorMsg('Akunmu dinonaktifkan. Hubungi Owner')
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
    <div className="min-h-screen bg-[#F2F9FE] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[16px] shadow-sm border border-[#EAF2FA] p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#757575] hover:text-[#212121] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Depan</span>
        </Link>

        {/* Brand */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#2196F3] flex items-center justify-center text-white shadow-sm shadow-blue-200">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base text-[#212121] leading-tight">Cemerlang Jaya Motor</h1>
            <p className="text-xs text-[#757575]">Sistem Manajemen Bengkel</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#212121]">Masuk ke Akun</h2>
          <p className="text-xs text-[#757575] mt-1">
            Gunakan email dan kata sandi yang telah didaftarkan oleh Owner
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E53935]" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              label="Email"
              type="email"
              placeholder="nama@cemerlangjaya.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Kata Sandi"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full py-2.5 mt-2">
            Masuk
          </Button>
        </form>

        {/* Demo Fast Fill Buttons for Testing */}
        <div className="mt-8 pt-6 border-t border-[#EAF2FA]">
          <p className="text-[11px] font-semibold text-[#757575] uppercase tracking-wider mb-2">
            Akun Latihan / Demo (Klik Cepat):
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillQuickAccount('owner@cemerlangjaya.test')}
              className="p-2 text-left rounded-[8px] border border-[#EAF2FA] hover:bg-[#F2F9FE] transition-colors"
            >
              <p className="font-semibold text-[#212121]">Pak Darto</p>
              <p className="text-[10px] text-[#1976D2]">Owner</p>
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('admin@cemerlangjaya.test')}
              className="p-2 text-left rounded-[8px] border border-[#EAF2FA] hover:bg-[#F2F9FE] transition-colors"
            >
              <p className="font-semibold text-[#212121]">Rina</p>
              <p className="text-[10px] text-[#2E7D32]">Admin</p>
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('joko@cemerlangjaya.test')}
              className="p-2 text-left rounded-[8px] border border-[#EAF2FA] hover:bg-[#F2F9FE] transition-colors"
            >
              <p className="font-semibold text-[#212121]">Pak Joko</p>
              <p className="text-[10px] text-[#F59E0B]">Kepala Mekanik Tim A</p>
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('slamet@cemerlangjaya.test')}
              className="p-2 text-left rounded-[8px] border border-[#EAF2FA] hover:bg-[#F2F9FE] transition-colors"
            >
              <p className="font-semibold text-[#212121]">Pak Slamet</p>
              <p className="text-[10px] text-[#7E57C2]">Kepala Mekanik Tim B</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2F9FE] flex items-center justify-center">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  )
}

