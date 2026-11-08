export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'admin' | 'kepala_mekanik'
export type WOStatus =
  | 'menunggu'
  | 'dikerjakan'
  | 'tertunda'
  | 'selesai'
  | 'siap_diambil'
  | 'diambil'
  | 'dibatalkan'
export type ItemJenis = 'part' | 'jasa'
export type PaymentMetode = 'tunai' | 'transfer' | 'qris'
export type InvoiceStatusBayar = 'belum_bayar' | 'sebagian' | 'lunas'
export type PhotoJenis = 'stnk' | 'kondisi_awal' | 'kondisi_akhir' | 'pengerjaan'

export interface Profile {
  id: string
  nama: string
  email: string
  role: UserRole
  aktif: boolean
  created_at: string
}

export interface Mekanik {
  id: string
  nama: string
  kepala_mekanik_id: string
  aktif: boolean
  created_at: string
}

export interface Customer {
  id: string
  tipe: 'perorangan' | 'perusahaan'
  nama: string
  telepon: string
  email: string | null
  alamat: string | null
  created_at: string
}

export interface Vehicle {
  id: string
  customer_id: string
  plat: string
  merek_model: string
  tahun: number | null
  warna: string | null
  transmisi: 'AT' | 'MT' | null
  created_at: string
}

export interface InventoryItem {
  id: string
  kode: string
  jenis: ItemJenis
  nama: string
  harga_jual: number
  stok: number
  stok_minimum: number
  aktif: boolean
  created_at: string
  updated_at: string
  // Jika dijoin untuk Owner
  inventory_costs?: {
    harga_modal: number
  } | null
}

export interface InventoryCost {
  item_id: string
  harga_modal: number
  updated_at: string
}

export interface StockMovement {
  id: number
  item_id: string
  jenis: 'masuk' | 'keluar' | 'kembali' | 'penyesuaian'
  jumlah: number
  stok_sesudah: number
  keterangan: string | null
  work_order_id: string | null
  dicatat_oleh: string | null
  created_at: string
  inventory_items?: {
    nama: string
    kode: string
    jenis: string
  }
  profiles?: {
    nama: string
  }
}

export interface WorkOrder {
  id: string
  nomor: string
  vehicle_id: string
  customer_id: string
  kepala_mekanik_id: string
  odometer: number
  keluhan: string
  diagnosis: string | null
  status: WOStatus
  estimasi_selesai: string | null
  catatan_status: string | null
  diskon: number
  alasan_diskon: string | null
  selesai_at: string | null
  diambil_at: string | null
  dibuat_oleh: string | null
  created_at: string
  updated_at: string
  // Relasi
  vehicles?: Vehicle
  customers?: Customer
  profiles?: Profile
  kepala_mekanik?: Profile
  work_order_mekanik?: {
    mekanik: Mekanik
  }[]
  invoices?: Invoice | null
  billing_items?: BillingItem[]
  work_order_photos?: WorkOrderPhoto[]
}

export interface WorkOrderPhoto {
  id: string
  work_order_id: string
  jenis: PhotoJenis
  path: string
  diunggah_oleh: string | null
  created_at: string
}

export interface BillingItem {
  id: string
  work_order_id: string
  item_id: string
  nama_item: string
  jenis: ItemJenis
  jumlah: number
  harga_master: number
  harga_dipakai: number
  alasan_penyesuaian: string | null
  disesuaikan_oleh: string | null
  disesuaikan_at: string | null
  ditambah_oleh: string | null
  created_at: string
  billing_item_costs?: {
    harga_modal: number
  } | null
}

export interface Invoice {
  id: string
  work_order_id: string
  nomor: string
  subtotal: number
  diskon: number
  total: number
  terbayar: number
  status_bayar: InvoiceStatusBayar
  diterbitkan_oleh: string | null
  diterbitkan_at: string
  payments?: Payment[]
}

export interface Payment {
  id: string
  invoice_id: string
  metode: PaymentMetode
  jumlah: number
  dicatat_oleh: string | null
  created_at: string
  profiles?: {
    nama: string
  }
}

export interface WOStatusHistory {
  id: number
  work_order_id: string
  dari_status: string | null
  ke_status: string
  catatan: string | null
  oleh: string | null
  created_at: string
  profiles?: {
    nama: string
    role: string
  }
}

export interface AuditLog {
  id: number
  waktu: string
  pelaku_id: string | null
  pelaku_peran: string | null
  aksi: string
  tabel: string
  data_id: string | null
  sebelum: Json | null
  sesudah: Json | null
  alasan: string | null
}

export interface WorkshopSettings {
  id: number
  nama: string
  alamat: string
  telepon: string
  jam_buka: string
  logo_path: string | null
  galeri_paths: string[]
  updated_at: string
}
