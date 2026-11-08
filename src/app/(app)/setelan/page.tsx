'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Upload, Image, Trash2, CheckCircle, Car } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { Profile, WorkshopSettings } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function SetelanPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<WorkshopSettings | null>(null)

  // Form Fields
  const [nama, setNama] = useState('')
  const [alamat, setAlamat] = useState('')
  const [telepon, setTelepon] = useState('')
  const [jamBuka, setJamBuka] = useState('')
  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [galeriPaths, setGaleriPaths] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  async function loadData() {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (prof) {
        if (prof.role !== 'owner') {
          router.push('/dashboard')
          return
        }
        setProfile(prof as Profile)
      }

      const { data: setts } = await supabase
        .from('workshop_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (setts) {
        setSettings(setts)
        setNama(setts.nama)
        setAlamat(setts.alamat)
        setTelepon(setts.telepon)
        setJamBuka(setts.jam_buka)
        setLogoPath(setts.logo_path)
        setGaleriPaths(setts.galeri_paths || [])
      }
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMsg('')

    try {
      const { error } = await supabase
        .from('workshop_settings')
        .update({
          nama: nama.trim(),
          alamat: alamat.trim(),
          telepon: telepon.trim(),
          jam_buka: jamBuka.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)

      if (error) throw error
      setSuccessMsg('Pengaturan profil bengkel berhasil disimpan!')
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan')
    } finally {
      setIsSaving(false)
    }
  }

  // Upload Logo ke bucket publik
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    setIsSaving(true)

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      })

      const path = `logo/logo_${Date.now()}.png`
      const { error: upErr } = await supabase.storage.from('publik').upload(path, compressed, {
        cacheControl: '31536000',
        upsert: true,
      })
      if (upErr) throw upErr

      await supabase
        .from('workshop_settings')
        .update({ logo_path: path })
        .eq('id', 1)

      setLogoPath(path)
      setSuccessMsg('Logo bengkel berhasil diperbarui!')
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah logo')
    } finally {
      setIsSaving(false)
    }
  }

  // Upload Galeri Foto ke bucket publik
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    setIsSaving(true)

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: 'image/webp',
      })

      const path = `galeri/foto_${Date.now()}.webp`
      const { error: upErr } = await supabase.storage.from('publik').upload(path, compressed, {
        cacheControl: '31536000',
        upsert: true,
      })
      if (upErr) throw upErr

      const updated = [...galeriPaths, path]
      await supabase
        .from('workshop_settings')
        .update({ galeri_paths: updated })
        .eq('id', 1)

      setGaleriPaths(updated)
      setSuccessMsg('Foto galeri berhasil ditambahkan!')
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto galeri')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteGalleryPhoto = async (index: number) => {
    if (!confirm('Hapus foto ini dari galeri?')) return
    const updated = galeriPaths.filter((_, i) => i !== index)
    try {
      await supabase
        .from('workshop_settings')
        .update({ galeri_paths: updated })
        .eq('id', 1)
      setGaleriPaths(updated)
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus foto')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2196F3]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#212121]">Setelan Profil Bengkel</h1>
        <p className="text-xs text-[#757575] mt-0.5">
          Identitas bengkel, logo resmi, alamat, jam operasional, dan galeri foto halaman depan (Khusus Owner)
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Informasi Bengkel Form */}
      <Card>
        <CardHeader>
          <CardTitle>Identitas & Kontak Bengkel</CardTitle>
        </CardHeader>
        <form onSubmit={handleSaveInfo} className="space-y-4 text-xs">
          <Input
            label="Nama Bengkel *"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
          />

          <Input
            label="Alamat Bengkel *"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nomor Telepon / Hotline *"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              required
            />

            <Input
              label="Jam Operasional *"
              placeholder="Contoh: Senin - Sabtu: 08:00 - 17:00"
              value={jamBuka}
              onChange={(e) => setJamBuka(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isSaving}>
              Simpan Identitas Bengkel
            </Button>
          </div>
        </form>
      </Card>

      {/* Upload Logo Bengkel */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Resmi Bengkel</CardTitle>
          <span className="text-xs text-[#757575]">Disimpan di bucket publik untuk sidebar & invoice</span>
        </CardHeader>

        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl bg-slate-100 border border-[#EAF2FA] flex items-center justify-center overflow-hidden">
            {logoPath ? (
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/publik/${logoPath}`}
                alt="Logo"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <Car className="w-8 h-8 text-[#2196F3]" />
            )}
          </div>

          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-white border border-[#EAF2FA] hover:bg-[#F2F9FE] text-xs font-semibold text-[#212121]">
              <Upload className="w-4 h-4 text-[#2196F3]" />
              <span>Ganti Logo Bengkel</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            <p className="text-[11px] text-[#757575] mt-1.5">
              Format PNG, JPEG, WebP. Maksimal ukuran 1 MB.
            </p>
          </div>
        </div>
      </Card>

      {/* Galeri Foto Halaman Depan */}
      <Card>
        <CardHeader>
          <CardTitle>Galeri Foto Halaman Depan ({galeriPaths.length} Foto)</CardTitle>
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#2196F3] text-white text-xs font-medium hover:bg-[#1976D2]">
            <Upload className="w-3.5 h-3.5" />
            <span>+ Unggah Foto Galeri</span>
            <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
          </label>
        </CardHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {galeriPaths.length === 0 ? (
            <p className="col-span-3 text-xs text-[#757575] py-4 text-center">
              Belum ada foto galeri diunggah.
            </p>
          ) : (
            galeriPaths.map((p, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#EAF2FA] h-32">
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/publik/${p}`}
                  alt={`Galeri ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteGalleryPhoto(idx)}
                  className="absolute top-2 right-2 bg-rose-600 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                  title="Hapus foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

