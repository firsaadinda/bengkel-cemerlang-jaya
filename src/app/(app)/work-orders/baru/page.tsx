'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car, User, Camera, Upload, AlertCircle, CheckCircle, Wrench } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { Profile, Customer, Vehicle } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatPlat } from '@/lib/utils'

export default function NewWorkOrderPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [teams, setTeams] = useState<any[]>([])

  // Search plat & auto-fill
  const [platInput, setPlatInput] = useState('')
  const [isSearchingPlat, setIsSearchingPlat] = useState(false)
  const [existingVehicle, setExistingVehicle] = useState<Vehicle | null>(null)
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null)
  const [isPlatChecked, setIsPlatChecked] = useState(false)

  // Form Pelanggan Baru (jika plat belum terdaftar)
  const [custTipe, setCustTipe] = useState<'perorangan' | 'perusahaan'>('perorangan')
  const [custNama, setCustNama] = useState('')
  const [custTelepon, setCustTelepon] = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [custAlamat, setCustAlamat] = useState('')

  // Form Kendaraan Baru (jika plat belum terdaftar)
  const [vehMerekModel, setVehMerekModel] = useState('')
  const [vehTahun, setVehTahun] = useState('')
  const [vehWarna, setVehWarna] = useState('')
  const [vehTransmisi, setVehTransmisi] = useState<'AT' | 'MT'>('AT')

  // Form Data Masuk WO
  const [odometer, setOdometer] = useState<number | ''>('')
  const [keluhan, setKeluhan] = useState('')
  const [selectedTim, setSelectedTim] = useState('')

  // Foto
  const [fotoStnk, setFotoStnk] = useState<File | null>(null)
  const [fotoStnkPreview, setFotoStnkPreview] = useState<string | null>(null)
  const [fotosKondisiAwal, setFotosKondisiAwal] = useState<File[]>([])
  const [fotosAwalPreviews, setFotosAwalPreviews] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function loadInitial() {
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
      if (prof) setCurrentUser(prof as Profile)

      // Ambil tim kepala mekanik beserta jumlah WO aktif mereka
      const { data: kepalaList } = await supabase
        .from('profiles')
        .select('id, nama')
        .eq('role', 'kepala_mekanik')
        .eq('aktif', true)

      if (kepalaList) {
        const timsWithCount = await Promise.all(
          kepalaList.map(async (k) => {
            const { count } = await supabase
              .from('work_orders')
              .select('*', { count: 'exact', head: true })
              .eq('kepala_mekanik_id', k.id)
              .in('status', ['menunggu', 'dikerjakan', 'tertunda'])
            return {
              ...k,
              activeCount: count || 0,
            }
          })
        )
        setTeams(timsWithCount)
        if (timsWithCount.length > 0) {
          setSelectedTim(timsWithCount[0].id)
        }
      }
    }
    loadInitial()
  }, [])

  // Cari Plat Nomor
  const handleCheckPlat = async () => {
    if (!platInput.trim()) return
    setIsSearchingPlat(true)
    setErrorMsg('')

    const formattedPlat = formatPlat(platInput)
    setPlatInput(formattedPlat)

    const { data: veh } = await supabase
      .from('vehicles')
      .select('*, customers(*)')
      .eq('plat', formattedPlat)
      .maybeSingle()

    if (veh) {
      setExistingVehicle(veh as Vehicle)
      setExistingCustomer(veh.customers as Customer)
      setIsPlatChecked(true)
    } else {
      setExistingVehicle(null)
      setExistingCustomer(null)
      setIsPlatChecked(true)
    }
    setIsSearchingPlat(false)
  }

  // Handle Foto STNK
  const handleStnkChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: 'image/webp',
        })
        setFotoStnk(compressed)
        setFotoStnkPreview(URL.createObjectURL(compressed))
      } catch {
        setFotoStnk(file)
        setFotoStnkPreview(URL.createObjectURL(file))
      }
    }
  }

  // Handle Foto Kondisi Awal (1-6)
  const handleAwalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      if (fotosKondisiAwal.length + selected.length > 6) {
        setErrorMsg('Maksimal 6 foto kondisi awal')
        return
      }

      const compressedFiles = await Promise.all(
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

      const updated = [...fotosKondisiAwal, ...compressedFiles]
      setFotosKondisiAwal(updated)
      setFotosAwalPreviews(updated.map((f) => URL.createObjectURL(f)))
    }
  }

  const removeFotoAwal = (index: number) => {
    const updated = fotosKondisiAwal.filter((_, i) => i !== index)
    setFotosKondisiAwal(updated)
    setFotosAwalPreviews(updated.map((f) => URL.createObjectURL(f)))
  }

  // Submit Form WO Baru
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!isPlatChecked) {
      setErrorMsg('Silakan periksa plat nomor terlebih dahulu')
      return
    }

    if (odometer === '' || Number(odometer) < 0) {
      setErrorMsg('Odometer wajib diisi dengan benar (≥ 0)')
      return
    }

    if (!keluhan.trim()) {
      setErrorMsg('Keluhan pelanggan wajib diisi')
      return
    }

    if (!selectedTim) {
      setErrorMsg('Pilih Tim Kepala Mekanik')
      return
    }

    if (!fotoStnk) {
      setErrorMsg('Foto STNK wajib diunggah')
      return
    }

    if (fotosKondisiAwal.length < 1) {
      setErrorMsg('Minimal 1 foto kondisi awal wajib diunggah')
      return
    }

    setIsLoading(true)

    try {
      let vehicleId = existingVehicle?.id

      // Jika kendaraan belum ada, buat pelanggan & kendaraan baru
      if (!vehicleId) {
        if (!custNama.trim() || !custTelepon.trim() || !vehMerekModel.trim()) {
          setErrorMsg('Nama pelanggan, nomor telepon, dan merek kendaraan wajib diisi')
          setIsLoading(false)
          return
        }

        // Simpan / cari customer berdasarkan telepon
        let customerId: string
        const { data: foundCust } = await supabase
          .from('customers')
          .select('id')
          .eq('telepon', custTelepon.trim())
          .maybeSingle()

        if (foundCust) {
          customerId = foundCust.id
        } else {
          const { data: newCust, error: custErr } = await supabase
            .from('customers')
            .insert({
              tipe: custTipe,
              nama: custNama.trim(),
              telepon: custTelepon.trim(),
              email: custEmail.trim() || null,
              alamat: custAlamat.trim() || null,
            })
            .select()
            .single()

          if (custErr) throw custErr
          customerId = newCust.id
        }

        // Simpan kendaraan baru
        const { data: newVeh, error: vehErr } = await supabase
          .from('vehicles')
          .insert({
            customer_id: customerId,
            plat: formatPlat(platInput),
            merek_model: vehMerekModel.trim(),
            tahun: vehTahun ? parseInt(vehTahun) : null,
            warna: vehWarna.trim() || null,
            transmisi: vehTransmisi,
          })
          .select()
          .single()

        if (vehErr) throw vehErr
        vehicleId = newVeh.id
      }

      // Panggil fungsi buat_work_order
      const { data: woId, error: woErr } = await supabase.rpc('buat_work_order', {
        p_vehicle_id: vehicleId,
        p_kepala_mekanik_id: selectedTim,
        p_odometer: Number(odometer),
        p_keluhan: keluhan.trim(),
      })

      if (woErr) throw woErr

      // Unggah foto STNK
      const stnkPath = `${woId}/stnk/${Date.now()}.webp`
      const { error: upStnkErr } = await supabase.storage
        .from('foto-wo')
        .upload(stnkPath, fotoStnk)

      if (!upStnkErr) {
        await supabase.from('work_order_photos').insert({
          work_order_id: woId,
          jenis: 'stnk',
          path: stnkPath,
          diunggah_oleh: currentUser?.id,
        })
      }

      // Unggah foto Kondisi Awal
      for (let i = 0; i < fotosKondisiAwal.length; i++) {
        const file = fotosKondisiAwal[i]
        const awalPath = `${woId}/kondisi_awal/${Date.now()}_${i}.webp`
        const { error: upAwalErr } = await supabase.storage
          .from('foto-wo')
          .upload(awalPath, file)

        if (!upAwalErr) {
          await supabase.from('work_order_photos').insert({
            work_order_id: woId,
            jenis: 'kondisi_awal',
            path: awalPath,
            diunggah_oleh: currentUser?.id,
          })
        }
      }

      router.push(`/work-orders/${woId}`)
    } catch (err: any) {
      console.error('Error creating work order:', err)
      setErrorMsg(err.message || 'Gagal membuat work order. Periksa data kembali.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1.5 text-xs text-[#757575] hover:text-[#212121] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Work Order</span>
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-[#212121]">Buat Work Order Baru</h1>
        <p className="text-xs text-[#757575] mt-0.5">
          Penerimaan mobil datang, pencatatan keluhan, foto fisik, dan penunjukan tim
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E53935]" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Plat Nomor & Pelanggan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#2196F3]" />
              <span>1. Identifikasi Kendaraan & Pelanggan</span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <Input
                  label="Ketik Plat Nomor Kendaraan *"
                  placeholder="Contoh: B 1234 ABC"
                  value={platInput}
                  onChange={(e) => {
                    setPlatInput(e.target.value.toUpperCase())
                    setIsPlatChecked(false)
                  }}
                  required
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCheckPlat}
                isLoading={isSearchingPlat}
                className="w-full sm:w-auto"
              >
                Cek Plat Nomor
              </Button>
            </div>

            {/* Kondisi 1: Plat Ditemukan */}
            {isPlatChecked && existingVehicle && existingCustomer && (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1976D2] flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
                    Kendaraan & Pelanggan Terdaftar
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlatChecked(false)
                      setExistingVehicle(null)
                    }}
                    className="text-xs text-[#1976D2] underline cursor-pointer"
                  >
                    Ubah
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-[#212121]">{existingCustomer.nama} ({existingCustomer.tipe})</p>
                    <p className="text-[#4A5565]">Telp: {existingCustomer.telepon}</p>
                    <p className="text-[#757575]">{existingCustomer.alamat || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#212121]">{existingVehicle.plat} &middot; {existingVehicle.merek_model}</p>
                    <p className="text-[#4A5565]">
                      Tahun {existingVehicle.tahun || '-'} &middot; Warna {existingVehicle.warna || '-'} &middot; Transmisi {existingVehicle.transmisi || '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Kondisi 2: Plat Belum Terdaftar -> Form Lengkap */}
            {isPlatChecked && !existingVehicle && (
              <div className="space-y-4 pt-2 border-t border-[#EAF2FA]">
                <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium">
                  Plat nomor belum terdaftar di sistem. Lengkapi data pelanggan dan kendaraan berikut:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4A5565] mb-1">Tipe Pelanggan</label>
                    <select
                      value={custTipe}
                      onChange={(e) => setCustTipe(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
                    >
                      <option value="perorangan">Perorangan</option>
                      <option value="perusahaan">Perusahaan</option>
                    </select>
                  </div>

                  <Input
                    label="Nama Pelanggan *"
                    placeholder="Nama lengkap"
                    value={custNama}
                    onChange={(e) => setCustNama(e.target.value)}
                    required
                  />

                  <Input
                    label="Nomor Telepon/WhatsApp *"
                    placeholder="Contoh: 081234567890"
                    value={custTelepon}
                    onChange={(e) => setCustTelepon(e.target.value)}
                    required
                  />

                  <Input
                    label="Email (Opsional)"
                    type="email"
                    placeholder="email@example.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Alamat (Opsional)"
                      placeholder="Alamat pelanggan"
                      value={custAlamat}
                      onChange={(e) => setCustAlamat(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Merek & Model Kendaraan *"
                    placeholder="Contoh: Toyota Avanza 1.3 G"
                    value={vehMerekModel}
                    onChange={(e) => setVehMerekModel(e.target.value)}
                    required
                  />

                  <Input
                    label="Tahun Pembuatan"
                    type="number"
                    placeholder="Contoh: 2020"
                    value={vehTahun}
                    onChange={(e) => setVehTahun(e.target.value)}
                  />

                  <Input
                    label="Warna"
                    placeholder="Contoh: Hitam Metalik"
                    value={vehWarna}
                    onChange={(e) => setVehWarna(e.target.value)}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-[#4A5565] mb-1">Transmisi</label>
                    <select
                      value={vehTransmisi}
                      onChange={(e) => setVehTransmisi(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
                    >
                      <option value="AT">Automatic (AT)</option>
                      <option value="MT">Manual (MT)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Step 2: Data Masuk & Keluhan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#2196F3]" />
              <span>2. Keluhan & Data Fisik Kunjungan</span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Odometer Saat Masuk (Km) *"
                type="number"
                min="0"
                placeholder="Contoh: 45000"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value ? Number(e.target.value) : '')}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-[#4A5565] mb-1">Tim Kepala Mekanik *</label>
                <select
                  value={selectedTim}
                  onChange={(e) => setSelectedTim(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121]"
                  required
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama} ({t.activeCount} WO aktif)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A5565] mb-1">Keluhan Pelanggan *</label>
              <textarea
                rows={3}
                placeholder="Tuliskan keluhan atau permintaan servis dari pelanggan..."
                value={keluhan}
                onChange={(e) => setKeluhan(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px] text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                required
              />
            </div>
          </div>
        </Card>

        {/* Step 3: Foto STNK & Kondisi Awal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#2196F3]" />
              <span>3. Dokumentasi Foto (Privat)</span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-6">
            {/* Foto STNK */}
            <div>
              <label className="block text-xs font-semibold text-[#4A5565] mb-2">Foto STNK * (1 Foto)</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer px-4 py-2 rounded-[10px] border border-dashed border-[#2196F3] bg-blue-50/50 hover:bg-blue-50 text-xs text-[#1976D2] font-semibold flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Unggah STNK</span>
                  <input type="file" accept="image/*" onChange={handleStnkChange} className="hidden" />
                </label>
                {fotoStnkPreview && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#EAF2FA]">
                    <img src={fotoStnkPreview} alt="Preview STNK" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Foto Kondisi Awal */}
            <div>
              <label className="block text-xs font-semibold text-[#4A5565] mb-2">
                Foto Kondisi Awal Mobil * (1 sampai 6 foto)
              </label>
              <div className="space-y-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-dashed border-[#2196F3] bg-blue-50/50 hover:bg-blue-50 text-xs text-[#1976D2] font-semibold">
                  <Upload className="w-4 h-4" />
                  <span>Tambah Foto Kondisi Awal</span>
                  <input type="file" accept="image/*" multiple onChange={handleAwalChange} className="hidden" />
                </label>

                {fotosAwalPreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {fotosAwalPreviews.map((src, idx) => (
                      <div key={idx} className="relative group w-full h-24 rounded-lg overflow-hidden border border-[#EAF2FA]">
                        <img src={src} alt={`Kondisi ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFotoAwal(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Link href="/work-orders">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
          <Button type="submit" isLoading={isLoading} className="px-6">
            Simpan & Buat Work Order
          </Button>
        </div>
      </form>
    </div>
  )
}

