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
    <div className="w-full bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl p-4 sm:p-6 shadow-2xl text-left relative overflow-hidden transition-all">
      {/* Header Widget */}
      <div className="mb-3">
        <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight uppercase">
          Cek Progres Servis Mobil
        </h3>
        <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
          Pantau tahapan pengerjaan kendaraan Anda tanpa perlu menunggu di bengkel.
        </p>
      </div>

      {/* Mode A: Jika Sudah Ada Hasil Pencarian */}
      {result ? (
        <div className="mt-4 pt-3.5 border-t border-stone-100 space-y-3.5">
          {/* Identitas Mobil & Status Badge */}
          <div className="flex items-start justify-between gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3">
            <div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-black text-stone-900 uppercase tracking-wider">
                  {result.plat}
                </span>
              </div>
              <p className="text-xs text-stone-700 font-semibold mt-0.5">
                {result.merek_model} {result.tahun ? `(${result.tahun})` : ''}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                No. WO: <span className="text-stone-800 font-mono font-semibold">{result.nomor_wo}</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              {result.status === 'siap_diambil' || result.status === 'diambil' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Siap Diambil
                </span>
              ) : result.status === 'selesai' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-sky-600" />
                  Uji QC & Test
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-300 uppercase tracking-wider">
                  <Wrench className="w-3 h-3 text-amber-600" />
                  Dikerjakan
                </span>
              )}
              <p className="text-[10px] text-stone-500 mt-1">
                Estimasi: <span className="text-stone-800 font-bold">{result.estimasi_selesai}</span>
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
                          ? 'bg-amber-400'
                          : 'bg-stone-200'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-bold uppercase tracking-tight ${
                        isCurrent
                          ? 'text-amber-600'
                          : isPassed
                          ? 'text-stone-800'
                          : 'text-stone-400'
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
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-700 leading-relaxed">
            <span className="text-[10px] text-stone-400 font-bold uppercase block mb-0.5">
              Keluhan & Pengerjaan:
            </span>
            <p className="line-clamp-2 text-[11px] text-stone-600">{result.diagnosis || result.keluhan}</p>
          </div>

          {/* Tombol Cek Plat Lain */}
          <button
            type="button"
            onClick={handleReset}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 py-1.5 transition-colors font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Cek Nomor Plat Lain</span>
          </button>
        </div>
      ) : (
        /* Mode B: Form Input Pencarian Plat */
        <div className="mt-4 pt-3 border-t border-stone-100 space-y-3">
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
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
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
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span>{notFoundMsg}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
