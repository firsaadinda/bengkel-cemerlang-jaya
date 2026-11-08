'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, Plus, User, Wrench, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Mekanik } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

export default function TimMekanikPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [kepalaList, setKepalaList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal Tambah Mekanik
  const [isAddModal, setIsAddModal] = useState(false)
  const [newMekanikNama, setNewMekanikNama] = useState('')
  const [targetKepalaId, setTargetKepalaId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

      // Fetch all Kepala Mekanik
      const { data: heads } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'kepala_mekanik')
        .eq('aktif', true)
        .order('nama', { ascending: true })

      if (heads) {
        // Fetch mekanik and active WO load for each team
        const teamsData = await Promise.all(
          heads.map(async (head) => {
            const { data: meks } = await supabase
              .from('mekanik')
              .select('*')
              .eq('kepala_mekanik_id', head.id)
              .order('nama', { ascending: true })

            // Count active WOs for each mechanic
            const meksWithLoad = await Promise.all(
              (meks || []).map(async (m) => {
                const { count } = await supabase
                  .from('work_order_mekanik')
                  .select('work_orders!inner(id, status)', { count: 'exact', head: true })
                  .eq('mekanik_id', m.id)
                  .in('work_orders.status', ['dikerjakan', 'tertunda'])

                return {
                  ...m,
                  activeWoCount: count || 0,
                }
              })
            )

            return {
              ...head,
              mekanikList: meksWithLoad,
            }
          })
        )

        setKepalaList(teamsData)
        if (heads.length > 0) setTargetKepalaId(heads[0].id)
      }
    } catch (err) {
      console.error('Error loading tim mekanik:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const isOwner = profile?.role === 'owner'
  const isKepala = profile?.role === 'kepala_mekanik'

  // Tambah Mekanik
  const handleAddMekanik = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMekanikNama.trim()) return

    setIsSaving(true)
    try {
      const kepalaId = isOwner ? targetKepalaId : profile?.id
      const { error } = await supabase.from('mekanik').insert({
        nama: newMekanikNama.trim(),
        kepala_mekanik_id: kepalaId,
        aktif: true,
      })

      if (error) throw error

      setIsAddModal(false)
      setNewMekanikNama('')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan mekanik')
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle status aktif mekanik (Owner)
  const handleToggleAktif = async (m: any) => {
    if (!isOwner) return
    try {
      const { error } = await supabase
        .from('mekanik')
        .update({ aktif: !m.aktif })
        .eq('id', m.id)
      if (error) throw error
      loadData()
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status mekanik')
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#212121]">Tim Mekanik</h1>
          <p className="text-xs text-[#757575] mt-0.5">
            Daftar tim kerja di bawah Kepala Mekanik dan beban servis aktif
          </p>
        </div>

        {(isOwner || isKepala) && (
          <Button
            onClick={() => {
              if (isKepala) setTargetKepalaId(profile.id)
              setIsAddModal(true)
            }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Mekanik</span>
          </Button>
        )}
      </div>

      {/* Cards Tim Kepala Mekanik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {kepalaList.map((team) => {
          const isMyTeam = profile?.id === team.id
          return (
            <Card key={team.id} className="p-0 overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/30 border-b border-[#EAF2FA] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-[#212121]">{team.nama}</span>
                    {isMyTeam && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2196F3] text-white">
                        Tim Saya
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#757575] mt-0.5">{team.email}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white border border-[#EAF2FA] flex items-center justify-center text-[#1976D2] shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Anggota Mekanik */}
              <div className="p-5 divide-y divide-[#EAF2FA]">
                {team.mekanikList.length === 0 ? (
                  <p className="text-xs text-[#757575] py-4 text-center">Belum ada mekanik di tim ini.</p>
                ) : (
                  team.mekanikList.map((m: any) => (
                    <div key={m.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-[#4A5565]">
                          {m.nama.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#212121]">{m.nama}</span>
                            {!m.aktif && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-200 text-slate-600 font-semibold">
                                Nonaktif
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#757575]">
                            {m.activeWoCount} Work Order aktif sedang dikerjakan
                          </span>
                        </div>
                      </div>

                      {isOwner && (
                        <button
                          onClick={() => handleToggleAktif(m)}
                          className={`text-xs px-2.5 py-1 rounded-[8px] border transition-colors cursor-pointer ${
                            m.aktif
                              ? 'border-[#EAF2FA] text-[#757575] hover:bg-rose-50 hover:text-[#E53935]'
                              : 'border-emerald-200 bg-emerald-50 text-[#2E7D32]'
                          }`}
                        >
                          {m.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modal Tambah Mekanik */}
      <Modal
        isOpen={isAddModal}
        onClose={() => setIsAddModal(false)}
        title="Tambah Mekanik Baru"
        description="Mekanik dicatat sebagai data dan tidak memiliki akun login."
      >
        <form onSubmit={handleAddMekanik} className="space-y-4 text-xs">
          <Input
            label="Nama Mekanik *"
            placeholder="Contoh: Andi Wijaya"
            value={newMekanikNama}
            onChange={(e) => setNewMekanikNama(e.target.value)}
            required
          />

          {isOwner && (
            <div>
              <label className="block text-xs font-semibold text-[#4A5565] mb-1">
                Pilih Tim Kepala Mekanik *
              </label>
              <select
                value={targetKepalaId}
                onChange={(e) => setTargetKepalaId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAF2FA] rounded-[10px]"
                required
              >
                {kepalaList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Simpan Mekanik
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

