'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Car, Plus, Wrench, Phone, Mail, MapPin, Edit, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Customer, Vehicle, WorkOrder, Profile, WOStatus } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatPlat, formatDate, STATUS_WO_CONFIG, formatRupiah } from '@/lib/utils'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal Tambah Kendaraan
  const [isAddVehicleModal, setIsAddVehicleModal] = useState(false)
  const [vehPlat, setVehPlat] = useState('')
  const [vehMerekModel, setVehMerekModel] = useState('')
  const [vehTahun, setVehTahun] = useState('')
  const [vehWarna, setVehWarna] = useState('')
  const [vehTransmisi, setVehTransmisi] = useState<'AT' | 'MT'>('AT')
  const [isSavingVehicle, setIsSavingVehicle] = useState(false)
  const [vehErrorMsg, setVehErrorMsg] = useState('')

  // Modal Edit Pelanggan
  const [isEditCustModal, setIsEditCustModal] = useState(false)
  const [editNama, setEditNama] = useState('')
  const [editTelepon, setEditTelepon] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAlamat, setEditAlamat] = useState('')
  const [isSavingCust, setIsSavingCust] = useState(false)

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
      if (prof) setProfile(prof as Profile)

      // Fetch Customer
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

      if (custData) {
        setCustomer(custData)
        setEditNama(custData.nama)
        setEditTelepon(custData.telepon)
        setEditEmail(custData.email || '')
        setEditAlamat(custData.alamat || '')
      }

      // Fetch Vehicles
      const { data: vehData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      if (vehData) setVehicles(vehData as Vehicle[])

      // Fetch All WOs for this customer
      const { data: woData } = await supabase
        .from('work_orders')
        .select('*, vehicles(plat, merek_model), invoices(total, status_bayar)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      if (woData) setWorkOrders(woData)
    } catch (err) {
      console.error('Error loading customer detail:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [customerId])

  const canEdit = profile && profile.role !== 'kepala_mekanik'

  // Simpan Kendaraan Baru
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setVehErrorMsg('')

    if (!vehPlat.trim() || !vehMerekModel.trim()) {
      setVehErrorMsg('Plat nomor dan merek model wajib diisi')
      return
    }

    setIsSavingVehicle(true)
    try {
      const formattedPlat = formatPlat(vehPlat)
      const { error } = await supabase.from('vehicles').insert({
        customer_id: customerId,
        plat: formattedPlat,
        merek_model: vehMerekModel.trim(),
        tahun: vehTahun ? parseInt(vehTahun) : null,
        warna: vehWarna.trim() || null,
        transmisi: vehTransmisi,
      })

      if (error) {
        if (error.code === '23505') {
          setVehErrorMsg(`Plat ${formattedPlat} sudah terdaftar di sistem`)
        } else {
          setVehErrorMsg(error.message)
        }
        setIsSavingVehicle(false)
        return
      }

      setIsAddVehicleModal(false)
      setVehPlat('')
      setVehMerekModel('')
      setVehTahun('')
      setVehWarna('')
      loadData()
    } catch (err: any) {
      setVehErrorMsg(err.message || 'Gagal menyimpan kendaraan')
    } finally {
      setIsSavingVehicle(false)
    }
  }

  // Simpan Edit Pelanggan
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingCust(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          nama: editNama.trim(),
          telepon: editTelepon.trim(),
          email: editEmail.trim() || null,
          alamat: editAlamat.trim() || null,
        })
        .eq('id', customerId)

      if (error) throw error
      setIsEditCustModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data pelanggan')
    } finally {
      setIsSavingCust(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2196F3]" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[#757575]">Pelanggan tidak ditemukan.</p>
        <Link href="/pelanggan" className="mt-4 inline-block text-xs text-[#2196F3] font-semibold">
          &larr; Kembali ke daftar pelanggan
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/pelanggan"
          className="inline-flex items-center gap-1.5 text-xs text-[#757575] hover:text-[#212121] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Data Pelanggan</span>
        </Link>
      </div>

      {/* Customer Info Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#212121]">{customer.nama}</h1>
              <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCEBFB] text-[#1976D2]">
                {customer.tipe}
              </span>
            </div>
            <p className="text-xs text-[#757575]">Terdaftar sejak {formatDate(customer.created_at)}</p>
          </div>

          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setIsEditCustModal(true)} className="gap-1.5">
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-4 border-t border-[#EAF2FA] text-xs">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#2E7D32]" />
            <div>
              <span className="text-[#757575] block text-[10px]">Nomor Telepon:</span>
              <a href={`https://wa.me/${customer.telepon.replace(/[^0-9]/g, '')}`} target="_blank" className="font-semibold text-[#212121] hover:underline">
                {customer.telepon}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#2196F3]" />
            <div>
              <span className="text-[#757575] block text-[10px]">Alamat Email:</span>
              <span className="font-medium text-[#212121]">{customer.email || '-'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#F59E0B]" />
            <div>
              <span className="text-[#757575] block text-[10px]">Alamat Domisili:</span>
              <span className="font-medium text-[#212121]">{customer.alamat || '-'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Kendaraan Pelanggan Card */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-[#EAF2FA] flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#2196F3]" />
              <span>Daftar Kendaraan Terdaftar ({vehicles.length})</span>
            </CardTitle>
            <p className="text-xs text-[#757575] mt-0.5">Satu pelanggan dapat memiliki lebih dari satu armada kendaraan.</p>
          </div>

          {canEdit && (
            <Button size="sm" onClick={() => setIsAddVehicleModal(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Kendaraan</span>
            </Button>
          )}
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {vehicles.length === 0 ? (
            <p className="col-span-3 text-xs text-[#757575] py-4 text-center">
              Belum ada kendaraan yang didaftarkan untuk pelanggan ini.
            </p>
          ) : (
            vehicles.map((v) => (
              <div key={v.id} className="p-4 rounded-xl border border-[#EAF2FA] bg-[#F2F9FE]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-[#1976D2]">{v.plat}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#4A5565] border border-[#EAF2FA]">
                    {v.transmisi || 'AT'}
                  </span>
                </div>
                <p className="font-bold text-xs text-[#212121]">{v.merek_model}</p>
                <p className="text-[11px] text-[#757575]">
                  Tahun {v.tahun || '-'} &middot; Warna {v.warna || '-'}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Riwayat Servis (Work Order) */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-[#EAF2FA]">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#2196F3]" />
            <span>Riwayat Kunjungan Servis</span>
          </CardTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F9FE] text-[#757575] font-semibold border-b border-[#EAF2FA]">
              <tr>
                <th className="px-5 py-3">No WO</th>
                <th className="px-4 py-3">Kendaraan</th>
                <th className="px-4 py-3">Tanggal Datang</th>
                <th className="px-4 py-3">Keluhan</th>
                <th className="px-4 py-3">Total Invoice</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2FA]">
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#757575]">
                    Belum ada riwayat pengerjaan work order.
                  </td>
                </tr>
              ) : (
                workOrders.map((w) => {
                  const conf = STATUS_WO_CONFIG[w.status as WOStatus]
                  return (
                    <tr
                      key={w.id}
                      onClick={() => router.push(`/work-orders/${w.id}`)}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-5 py-3 font-bold text-[#212121]">{w.nomor}</td>
                      <td className="px-4 py-3 font-semibold text-[#1976D2]">{w.vehicles?.plat}</td>
                      <td className="px-4 py-3 text-[#4A5565]">{formatDate(w.created_at)}</td>
                      <td className="px-4 py-3 text-[#4A5565] truncate max-w-xs">{w.keluhan}</td>
                      <td className="px-4 py-3 font-semibold text-[#212121] tabular-nums">
                        {w.invoices?.total ? formatRupiah(w.invoices.total) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${conf.badgeClass}`}>
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/work-orders/${w.id}`)
                          }}
                        >
                          Lihat
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Tambah Kendaraan */}
      <Modal
        isOpen={isAddVehicleModal}
        onClose={() => setIsAddVehicleModal(false)}
        title="Tambah Kendaraan Pelanggan"
        description={`Menambahkan unit mobil baru milik ${customer.nama}`}
      >
        <form onSubmit={handleAddVehicle} className="space-y-4 text-xs">
          {vehErrorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">{vehErrorMsg}</div>
          )}

          <Input
            label="Plat Nomor Kendaraan *"
            placeholder="Contoh: B 1234 ABC"
            value={vehPlat}
            onChange={(e) => setVehPlat(e.target.value.toUpperCase())}
            required
          />

          <Input
            label="Merek & Model Kendaraan *"
            placeholder="Contoh: Toyota Avanza 1.3 G"
            value={vehMerekModel}
            onChange={(e) => setVehMerekModel(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tahun Pembuatan"
              type="number"
              placeholder="Contoh: 2021"
              value={vehTahun}
              onChange={(e) => setVehTahun(e.target.value)}
            />

            <Input
              label="Warna"
              placeholder="Contoh: Hitam Metalik"
              value={vehWarna}
              onChange={(e) => setVehWarna(e.target.value)}
            />
          </div>

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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddVehicleModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSavingVehicle}>
              Simpan Kendaraan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Pelanggan */}
      <Modal
        isOpen={isEditCustModal}
        onClose={() => setIsEditCustModal(false)}
        title="Edit Data Pelanggan"
        description="Perbarui informasi profil dan kontak pelanggan."
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
          <Input
            label="Nama Lengkap *"
            value={editNama}
            onChange={(e) => setEditNama(e.target.value)}
            required
          />

          <Input
            label="Nomor Telepon/WhatsApp *"
            value={editTelepon}
            onChange={(e) => setEditTelepon(e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />

          <Input
            label="Alamat"
            value={editAlamat}
            onChange={(e) => setEditAlamat(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditCustModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSavingCust}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

