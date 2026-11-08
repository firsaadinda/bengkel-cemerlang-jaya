# Aplikasi Manajemen Bengkel Cemerlang Jaya Motor

> **Bootcamp AI Web Programming · Sesi 9 · Ioda Academy**  
> Sistem digitalisasi operasional bengkel mobil terpadu dari kedatangan mobil, pengerjaan servis, pemeriksaan QC, penagihan invoice, hingga penyerahan kendaraan.

---

## 📌 Ringkasan Aplikasi

Aplikasi ini mencatat siklus lengkap kunjungan mobil di bengkel dalam satu **Work Order (WO)** dengan pembagian peran yang ketat:

- **Owner**: Pemilik bengkel yang memiliki visibilitas menyeluruh termasuk harga modal spare part, laba kotor per WO & periode, pengaturan profil bengkel, kelola peran pengguna, serta *audit log* sistem.
- **Admin**: Petugas meja depan & kasir yang menerima mobil datang, membuat WO, mengelola data pelanggan & kendaraan, menyesuaikan harga jual, menerbitkan invoice resmi, dan mencatat transaksi pembayaran.
- **Kepala Mekanik**: Pemimpin tim mekanik yang menugaskan teknisi, mencatat pemakaian spare part & jasa (stok berkurang otomatis secara atomik di database), serta melakukan QC (Quality Control) kelayakan mobil.
- **Mekanik**: Teknisi lapangan yang dicatat sebagai data tim (tanpa akun login) dan ditugaskan dalam setiap WO.

---

## 🛠 Tech Stack

- **Kerangka Aplikasi**: Next.js 15 (App Router) + TypeScript
- **Styling & Komponen**: Tailwind CSS + shadcn/ui + Lucide React
- **Grafik Interaktif**: Recharts
- **Database & Backend**: Supabase (PostgreSQL + RLS + Database Functions & Triggers)
- **Otentikasi**: Supabase Auth (Email & Kata Sandi) + Route Guard Middleware
- **Penyimpanan File**: Supabase Storage (Bucket privat `foto-wo` & bucket publik `publik`)
- **Kompresi Gambar**: `browser-image-compression` (diperkecil otomatis di browser sebelum upload)

---

## 🗄️ Struktur Database & File Supabase

Seluruh skema database, aturan keamanan Row Level Security (RLS), *database functions*, *triggers*, dan data contoh awal telah disediakan di direktori `supabase/`:

| File | Deskripsi |
|---|---|
| [`supabase/migrations/01_dasar.sql`](supabase/migrations/01_dasar.sql) | Skema tabel lengkap (`profiles`, `mekanik`, `customers`, `vehicles`, `inventory_items`, `inventory_costs`, `work_orders`, `billing_items`, `invoices`, `payments`, `audit_logs`, dll.), fungsi bisnis atomik (`buat_work_order`, `ubah_status_wo`, `tambah_item_tagihan`, dll.), trigger audit, RLS policies, dan bucket storage |
| [`supabase/migrations/dashboard.sql`](supabase/migrations/dashboard.sql) | Fungsi database agregasi KPI dan grafik performa hemat egress (`dashboard_ringkasan`, `dashboard_pendapatan_harian`, `dashboard_wo_per_status`, `laporan_laba`, dll.) |
| [`supabase/seed.sql`](supabase/seed.sql) | Data awal: 4 akun login siap pakai, 4 mekanik, 10 spare parts + modal rahasia, 6 jasa servis, 5 pelanggan & 7 kendaraan, serta 12 WO contoh lengkap dengan invoice |

---

## 🚀 Panduan Menjalankan Database di Supabase

### Langkah 1: Jalankan Migrasi Skema
1. Buka dashboard proyek Supabase Anda: [supabase.com/dashboard](https://supabase.com/dashboard).
2. Masuk ke menu **SQL Editor**.
3. Buka file `supabase/migrations/01_dasar.sql`, salin isinya, tempel ke SQL Editor, lalu klik **Run**.
4. Buka file `supabase/migrations/dashboard.sql`, salin isinya, tempel ke SQL Editor, lalu klik **Run**.

### Langkah 2: Jalankan Data Awal (Seed Data)
1. Di **SQL Editor** Supabase, buka file `supabase/seed.sql`, salin seluruh isinya, lalu klik **Run**.
2. Data akun pengguna, inventaris, pelanggan, dan work order contoh akan langsung terisi dan siap digunakan.

---

## 👥 Akun Uji Coba (Demo Credentials)

Gunakan akun berikut untuk menguji masing-masing peran di halaman `/login`:

| Peran | Nama | Email | Kata Sandi | Tim |
|---|---|---|---|---|
| **Owner** | Pak Darto | `owner@cemerlangjaya.test` | `Bengkel123!` | Semua Akses & Laba |
| **Admin** | Rina | `admin@cemerlangjaya.test` | `Bengkel123!` | Kasir & Front Office |
| **Kepala Mekanik** | Pak Joko | `joko@cemerlangjaya.test` | `Bengkel123!` | Tim A (Andi, Bayu) |
| **Kepala Mekanik** | Pak Slamet | `slamet@cemerlangjaya.test` | `Bengkel123!` | Tim B (Dedi, Eko) |

> *Catatan: Pada halaman login telah disediakan tombol "Klik Cepat Akun Demo" untuk memudahkan pengujian tanpa perlu mengetik ulang.*

---

## 💻 Menjalankan Aplikasi di Lokal

### 1. Salin Environment Variables
Buat file `.env.local` di root proyek:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
```

### 2. Jalankan Server Pengembangan
```bash
npm install
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 3. Build untuk Produksi
```bash
npm run build
npm run start
```
