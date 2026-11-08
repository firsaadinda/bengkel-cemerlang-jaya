'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserCog, Edit2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserRole } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ROLE_LABELS } from '@/lib/peran'
import { formatDate } from '@/lib/utils'

export default function PenggunaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Edit Modal
  const [isEditModal, setIsEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [editNama, setEditNama] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('kepala_mekanik')
  const [editAktif, setEditAktif] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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
        setCurrentUser(prof as Profile)
      }

      const { data: allUsers } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })
      if (allUsers) setProfiles(allUsers as Profile[])
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenEdit = (user: Profile) => {
    setSelectedUser(user)
    setEditNama(user.nama)
    setEditRole(user.role)
    setEditAktif(user.aktif)
    setErrorMsg('')
    setIsEditModal(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setErrorMsg('')

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nama: editNama.trim(),
          role: editRole,
          aktif: editAktif,
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      setIsEditModal(false)
      loadData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui pengguna')
    } finally {
      setIsSaving(false)
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#212121]">Kelola Pengguna & Peran Akun</h1>
        <p className="text-xs text-[#757575] mt-0.5">
          Atur peran akun sistem (Owner, Admin, Kepala Mekanik) serta aktivasi akun (Khusus Owner)
        </p>
      </div>

      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#1976D2] leading-relaxed">
        <strong>Panduan Pembuatan Akun Baru:</strong> Akun login didaftarkan melalui Supabase Auth Dashboard
        (Authentication &rarr; Users &rarr; Add user), setelah itu akun baru otomatis muncul di tabel ini untuk
        diberi peran dan diaktifkan oleh Owner.
      </div>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F9FE] text-[#757575] font-semibold border-b border-[#EAF2FA]">
              <tr>
                <th className="px-5 py-3.5">Nama</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Peran Akun</th>
                <th className="px-4 py-3.5">Status Aktif</th>
                <th className="px-4 py-3.5">Terdaftar Sejak</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2FA]">
              {profiles.map((u) => {
                const isSelf = currentUser?.id === u.id
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold text-[#212121]">
                      {u.nama} {isSelf && <span className="text-[#1976D2] font-semibold">(Anda)</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[#4A5565]">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCEBFB] text-[#1976D2]">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.aktif ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-[#2E7D32]" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-xs">
                          <XCircle className="w-3.5 h-3.5 text-[#E53935]" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#757575]">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(u)}>
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Edit Pengguna */}
      <Modal
        isOpen={isEditModal}
        onClose={() => setIsEditModal(false)}
        title={`Edit Pengguna: ${selectedUser?.email}`}
        description="Ubah nama, peran hak akses, dan status keaktifan akun."
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          {errorMsg && <div className="p-3 rounded bg-rose-50 text-rose-700">{errorMsg}</div>}

          <Input
            label="Nama Lengkap *"
            value={editNama}
            onChange={(e) => setEditNama(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#4A5565] mb-1">Peran Hak Akses *</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
            >
              <option value="owner">Owner (Akses Penuh + Modal & Laba)</option>
              <option value="admin">Admin Kasir & Meja Depan (Tanpa Modal)</option>
              <option value="kepala_mekanik">Kepala Mekanik (Pengerjaan Tim)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 p-3 rounded-lg border border-[#EAF2FA] bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={editAktif}
                onChange={(e) => setEditAktif(e.target.checked)}
                className="rounded text-[#2196F3]"
              />
              <div>
                <span className="font-bold text-[#212121]">Akun Aktif</span>
                <p className="text-[11px] text-[#757575]">
                  Jika dinonaktifkan, akun ini tidak akan bisa login ke aplikasi.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

