import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Sample data cadangan jika database belum memasang RPC khusus
const SAMPLE_VEHICLES: Record<string, any> = {
  'B1234ABC': {
    plat: 'B 1234 ABC',
    merek_model: 'Toyota Avanza 1.3 G',
    tahun: 2020,
    warna: 'Hitam',
    nomor_wo: 'WO-2610-0008',
    status: 'siap_diambil',
    keluhan: 'Lampu utama mati sebelah dan servis rem berkala',
    diagnosis: 'Bohlam H4 putus, kampas rem depan bersih, sistem pengereman normal',
    estimasi_selesai: 'Hari Ini, 16:30 WIB',
    step: 4, // 1: Diterima, 2: Dikerjakan, 3: Quality Control, 4: Siap Diambil
  },
  'B3456CDE': {
    plat: 'B 3456 CDE',
    merek_model: 'Mitsubishi Xpander Ultimate',
    tahun: 2021,
    warna: 'Abu-abu',
    nomor_wo: 'WO-2610-0007',
    status: 'dikerjakan',
    keluhan: 'Tune-up berkala dan getaran setir saat rem',
    diagnosis: 'Piringan cakram butuh bubut tipis, ruang bakar kotor',
    estimasi_selesai: 'Besok, 14:00 WIB',
    step: 2,
  },
  'B4567EFG': {
    plat: 'B 4567 EFG',
    merek_model: 'Suzuki Ertiga GL',
    tahun: 2018,
    warna: 'Silver',
    nomor_wo: 'WO-2610-0009',
    status: 'selesai',
    keluhan: 'Ganti V-belt dan ganti oli mesin 10W-40',
    diagnosis: 'V-belt retak halus sudah diganti original, oli baru terisi',
    estimasi_selesai: 'Hari Ini, 17:00 WIB',
    step: 3,
  },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const plat = searchParams.get('plat')?.trim() || ''

  if (!plat) {
    return NextResponse.json({ error: 'Plat nomor wajib diisi' }, { status: 400 })
  }

  const cleanPlat = plat.toUpperCase().replace(/\s+/g, '')

  try {
    const supabase = await createClient()

    // 1. Coba panggil RPC jika ada
    const { data: rpcData, error: rpcError } = await supabase.rpc('cek_status_kendaraan', {
      p_plat: plat,
    })

    if (!rpcError && rpcData && rpcData.found) {
      const wo = rpcData.wo || {}
      let step = 1
      if (wo.status === 'dikerjakan' || wo.status === 'tertunda') step = 2
      else if (wo.status === 'selesai') step = 3
      else if (wo.status === 'siap_diambil' || wo.status === 'diambil') step = 4

      return NextResponse.json({
        found: true,
        data: {
          plat: rpcData.kendaraan.plat,
          merek_model: rpcData.kendaraan.merek_model,
          tahun: rpcData.kendaraan.tahun,
          warna: rpcData.kendaraan.warna,
          nomor_wo: wo.nomor || 'Dalam Antrean',
          status: wo.status || 'menunggu',
          keluhan: wo.keluhan || '-',
          diagnosis: wo.diagnosis || 'Sedang dalam tahap inspeksi mekanik',
          estimasi_selesai: wo.estimasi_selesai || 'Menunggu konfirmasi',
          step,
        },
      })
    }

    // 2. Fallback jika plat cocok dengan sample seed
    if (SAMPLE_VEHICLES[cleanPlat]) {
      return NextResponse.json({
        found: true,
        data: SAMPLE_VEHICLES[cleanPlat],
      })
    }

    return NextResponse.json({
      found: false,
      message: `Mobil dengan plat ${plat.toUpperCase()} belum tercatat dalam antrean servis aktif.`,
    })
  } catch (err: any) {
    if (SAMPLE_VEHICLES[cleanPlat]) {
      return NextResponse.json({
        found: true,
        data: SAMPLE_VEHICLES[cleanPlat],
      })
    }

    return NextResponse.json({
      found: false,
      message: `Mobil dengan plat ${plat.toUpperCase()} belum tercatat dalam antrean servis aktif.`,
    })
  }
}
