'use client'

import React, { useState } from 'react'
import { Search, Car, CheckCircle2, Clock, Wrench, ShieldCheck, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react'

interface TrackingData {
  plat: string
  merek_model: string
  tahun: number
  warna?: string
  nomor_wo: string
  status: 'menunggu' | 'dikerjakan' | 'tertunda' | 'selesai' | 'siap_diambil' | 'diambil' | string
  keluhan: string
  diagnosis: string
  estimasi_selesai: string
  step: number // 1: Diterima, 2: Dikerjakan, 3: QC, 4: Siap Ambil
}

export function VehicleTrackingCard() {
  const [platInput, setPlatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TrackingData | null>(null)
  const [notFoundMsg, setNotFoundMsg] = useState('')

  const handleSearch = async (targetPlat?: string) => {
    const query = (targetPlat || platInput).trim()
    if (!query) return

    setIsLoading(true)
    setNotFoundMsg('')
    setResult(null)

    try {
      const res = await fetch(`/api/tracking?plat=${encodeURIComponent(query)}`)
      const json = await res.json()

      if (json.found && json.data) {
        setResult(json.data)
      } else {
        setNotFoundMsg(json.message || `Kendaraan plat ${query.toUpperCase()} tidak ditemukan dalam antrean servis aktif.`)
      }
    } catch {
      setNotFoundMsg('Gagal memeriksa status saat ini. Silakan coba kembali.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setNotFoundMsg('')
    setPlatInput('')
  }

  return (
    <div className="w-full bg-[#1A1614]/95 backdrop-blur-md border border-stone-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-left relative overflow-hidden transition-all">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Widget */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">
            Live Status Kendaraan
          </span>
        </div>
        <span className="text-[10px] text-stone-400 font-medium">Update Real-time</span>
      </div>

      <h3 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
        Cek Progres Servis Mobil
      </h3>
      <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
        Pantau tahapan pengerjaan kendaraan Anda tanpa perlu menunggu di bengkel.
      </p>

      {/* Mode A: Jika Sudah Ada Hasil Pencarian */}
      {result ? (
        <div className="mt-4 pt-3.5 border-t border-stone-800 space-y-3.5">
          {/* Identitas Mobil & Status Badge */}
          <div className="flex items-start justify-between gap-3 bg-stone-900/90 border border-stone-700/60 rounded-xl p-3">
            <div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {result.plat}
                </span>
              </div>
              <p className="text-xs text-stone-300 font-semibold mt-0.5">
                {result.merek_model} {result.tahun ? `(${result.tahun})` : ''}
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5">
                No. WO: <span className="text-stone-300 font-mono font-semibold">{result.nomor_wo}</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              {result.status === 'siap_diambil' || result.status === 'diambil' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-600/50 uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Siap Diambil
                </span>
              ) : result.status === 'selesai' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-950 text-sky-300 border border-sky-600/50 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-sky-400" />
                  Uji QC & Test
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-600/50 uppercase tracking-wider">
                  <Wrench className="w-3 h-3 text-amber-400" />
                  Dikerjakan
                </span>
              )}
              <p className="text-[10px] text-stone-400 mt-1">
                Estimasi: <span className="text-amber-300 font-semibold">{result.estimasi_selesai}</span>
              </p>
            </div>
          </div>

          {/* 4-Step Progress Indicator */}
          <div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                { step: 1, label: 'Penerimaan' },
                { step: 2, label: 'Pengerjaan' },
                { step: 3, label: 'QC & Test' },
                { step: 4, label: 'Siap Ambil' },
              ].map((item) => {
                const isPassed = result.step >= item.step
                const isCurrent = result.step === item.step
                return (
                  <div key={item.step} className="flex flex-col items-center">
                    <div
                      className={`w-full h-1.5 rounded-full mb-1 transition-all ${
                        isPassed
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'bg-stone-800'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-bold uppercase tracking-tight ${
                        isCurrent
                          ? 'text-amber-400'
                          : isPassed
                          ? 'text-stone-300'
                          : 'text-stone-600'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Catatan Diagnosis Singkat */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-300 leading-relaxed">
            <span className="text-[10px] text-stone-400 font-bold uppercase block mb-0.5">
              Keluhan & Pengerjaan:
            </span>
            <p className="line-clamp-2 text-[11px] text-stone-300">{result.diagnosis || result.keluhan}</p>
          </div>

          {/* Tombol Cek Plat Lain */}
          <button
            type="button"
            onClick={handleReset}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-stone-400 hover:text-white py-1.5 transition-colors font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Cek Nomor Plat Lain</span>
          </button>
        </div>
      ) : (
        /* Mode B: Form Input Pencarian Plat */
        <div className="mt-4 pt-3 border-t border-stone-800/80 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
            className="space-y-2.5"
          >
            <div className="relative">
              <Car className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={platInput}
                onChange={(e) => setPlatInput(e.target.value.toUpperCase())}
                placeholder="Contoh: B 1234 ABC"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-900/90 border border-stone-700 rounded-xl text-xs sm:text-sm text-white placeholder-stone-500 font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !platInput.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-400/20"
            >
              {isLoading ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Memeriksa Sistem...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 text-stone-950" />
                  <span>Cek Status Servis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Pesan jika tidak ditemukan */}
          {notFoundMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span>{notFoundMsg}</span>
              </div>
            </div>
          )}

          {/* Quick Chip Contoh Plat untuk Pengujian Langsung */}
          <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px]">
            <span className="text-stone-400">Coba plat demo:</span>
            <div className="flex items-center gap-1.5">
              {['B 1234 ABC', 'B 3456 CDE'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setPlatInput(sample)
                    handleSearch(sample)
                  }}
                  className="px-2 py-0.5 rounded-md bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-amber-300 font-mono text-[10px] font-bold border border-stone-700/80 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
