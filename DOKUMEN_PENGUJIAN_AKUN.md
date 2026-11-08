# DOKUMEN PENGUJIAN AKUN & SOLUSI LOGIN (SUPABASE)
**Aplikasi:** Bengkel Cemerlang Jaya  
**URL Aplikasi:** `http://localhost:3000`  
**Halaman Login:** `http://localhost:3000/login`

---

## 1. Daftar Akun Pengujian (Username & Password)

Semua akun pengujian di bawah ini menggunakan **Password yang sama**:
> ### 🔑 **Password:** `Bengkel123!`

| Role / Jabatan | Nama Pengguna | Email (Username Login) | Hak Akses Fitur Utama |
| :--- | :--- | :--- | :--- |
| **Owner (Pemilik)** | Pak Darto | `owner@cemerlangjaya.test` | Full dashboard eksekutif, rekap omzet harian/bulanan, laba kotor, performa mekanik & tim, margin suku cadang. |
| **Admin / SA & Kasir** | Rina | `admin@cemerlangjaya.test` | Pendaftaran pelanggan, buat Work Order (WO) & estimasi biaya, kasir / pembayaran & cetak invoice faktur, kelola stok & harga suku cadang. |
| **Kepala Mekanik (Tim A)** | Pak Joko | `joko@cemerlangjaya.test` | Dashboard mekanik, checklist inspeksi kendaraan 15 titik, input catatan pengerjaan, permintaan suku cadang ke gudang. |
| **Mekanik (Tim B)** | Pak Slamet | `slamet@cemerlangjaya.test` | Checklist servis, progres perbaikan, input jam kerja & pergantian sparepart. |

---

## 2. Penyebab Mengapa Saat Ini Belum Bisa Login

Pesan error yang terjadi di server saat mencoba login adalah:
```text
Error: Database error querying schema 500
message: permission denied for function peran_saya (Error Code 42501)
```

**Penjelasan Teknis:**  
Database Supabase Anda memiliki sistem proteksi data (*Row Level Security* / RLS) yang menggunakan fungsi internal bernama `private.peran_saya()`. Saat pengguna mencoba login atau membaca data profil, Supabase memeriksa fungsi tersebut. Karena hak akses (*permission*) fungsi tersebut di Supabase belum dibuka untuk role `anon` / `authenticated`, database memblokir proses query otentikasi sehingga muncul status `Database error querying schema 500`.

---

## 3. Langkah Memperbaiki (Hanya Butuh Waktu 1 Menit)

Anda hanya perlu mengeksekusi skrip perbaikan yang sudah kami siapkan di dalam dashboard Supabase:

### Langkah-langkah:
1. Buka browser dan masuk ke **Dashboard Supabase Project** Anda:  
   👉 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Pilih proyek bengkel Anda (**`bengkel-cemerlangjaya`**).
3. Di panel menu sebelah kiri, klik menu **SQL Editor** (ikon tanda `>_`).
4. Klik tombol **New query** (di pojok kiri atas SQL Editor).
5. Buka file di project lokal Anda:  
   📁 `supabase/fix_auth.sql`  
   *(atau copy seluruh kode SQL di bagian **Poin 4** di bawah ini)*.
6. Paste kode tersebut ke dalam kolom SQL Editor di Supabase.
7. Klik tombol hijau **RUN** (atau tekan `Ctrl + Enter`).
8. Pastikan muncul notifikasi **`Success. No rows returned`**.

---

## 4. Skrip SQL Perbaikan (`supabase/fix_auth.sql`)

Salin dan tempel kode berikut ke **SQL Editor Supabase**:

```sql
-- 1. Berikan hak akses fungsi private.peran_saya() dan schema private
grant usage on schema private to authenticated, anon;
grant execute on function private.peran_saya() to authenticated, anon;
grant execute on function private.tim_wo(uuid) to authenticated, anon;
grant execute on function private.nomor_berikut(text, text) to authenticated, anon;

-- Pastikan fungsi private.peran_saya() aman dan tidak error saat belum login (anon)
create or replace function private.peran_saya()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    return null;
  end if;
  
  select role into v_role
  from public.profiles
  where id = auth.uid() and aktif = true;
  return v_role;
end;
$$;

-- 2. Bersihkan akun lama agar sinkron
delete from public.profiles where email in ('owner@cemerlangjaya.test', 'admin@cemerlangjaya.test', 'joko@cemerlangjaya.test', 'slamet@cemerlangjaya.test');
delete from auth.users where email in ('owner@cemerlangjaya.test', 'admin@cemerlangjaya.test', 'joko@cemerlangjaya.test', 'slamet@cemerlangjaya.test');

-- 3. Masukkan 4 akun pengujian resmi (Password: Bengkel123!)
do $$
declare
  v_enc_pass text;
begin
  v_enc_pass := crypt('Bengkel123!', gen_salt('bf'));

  -- Pak Darto (Owner)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
    phone_change, phone_change_token, phone_change_sent_at, email_change_token_current,
    email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at,
    is_sso_user, deleted_at, is_anonymous
  ) values (
    '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'owner@cemerlangjaya.test', v_enc_pass,
    now(), null, '', null, '', null, '', '', null, now(),
    '{"provider":"email","providers":["email"]}', '{"nama":"Pak Darto","role":"owner"}',
    false, now(), now(), null, null, '', '', null, '', 0, null, '', null, false, null, false
  );

  insert into public.profiles (id, nama, email, role, aktif)
  values ('11111111-1111-1111-1111-111111111111', 'Pak Darto', 'owner@cemerlangjaya.test', 'owner', true)
  on conflict (id) do update set role = 'owner', aktif = true, nama = 'Pak Darto', email = 'owner@cemerlangjaya.test';

  -- Rina (Admin / Service Advisor & Kasir)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
    phone_change, phone_change_token, phone_change_sent_at, email_change_token_current,
    email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at,
    is_sso_user, deleted_at, is_anonymous
  ) values (
    '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'admin@cemerlangjaya.test', v_enc_pass,
    now(), null, '', null, '', null, '', '', null, now(),
    '{"provider":"email","providers":["email"]}', '{"nama":"Rina","role":"admin"}',
    false, now(), now(), null, null, '', '', null, '', 0, null, '', null, false, null, false
  );

  insert into public.profiles (id, nama, email, role, aktif)
  values ('22222222-2222-2222-2222-222222222222', 'Rina', 'admin@cemerlangjaya.test', 'admin', true)
  on conflict (id) do update set role = 'admin', aktif = true, nama = 'Rina', email = 'admin@cemerlangjaya.test';

  -- Pak Joko (Kepala Mekanik Tim A)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
    phone_change, phone_change_token, phone_change_sent_at, email_change_token_current,
    email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at,
    is_sso_user, deleted_at, is_anonymous
  ) values (
    '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'joko@cemerlangjaya.test', v_enc_pass,
    now(), null, '', null, '', null, '', '', null, now(),
    '{"provider":"email","providers":["email"]}', '{"nama":"Pak Joko","role":"mekanik"}',
    false, now(), now(), null, null, '', '', null, '', 0, null, '', null, false, null, false
  );

  insert into public.profiles (id, nama, email, role, aktif)
  values ('33333333-3333-3333-3333-333333333333', 'Pak Joko', 'joko@cemerlangjaya.test', 'mekanik', true)
  on conflict (id) do update set role = 'mekanik', aktif = true, nama = 'Pak Joko', email = 'joko@cemerlangjaya.test';

  -- Pak Slamet (Mekanik Tim B)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
    phone_change, phone_change_token, phone_change_sent_at, email_change_token_current,
    email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at,
    is_sso_user, deleted_at, is_anonymous
  ) values (
    '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'slamet@cemerlangjaya.test', v_enc_pass,
    now(), null, '', null, '', null, '', '', null, now(),
    '{"provider":"email","providers":["email"]}', '{"nama":"Pak Slamet","role":"mekanik"}',
    false, now(), now(), null, null, '', '', null, '', 0, null, '', null, false, null, false
  );

  insert into public.profiles (id, nama, email, role, aktif)
  values ('44444444-4444-4444-4444-444444444444', 'Pak Slamet', 'slamet@cemerlangjaya.test', 'mekanik', true)
  on conflict (id) do update set role = 'mekanik', aktif = true, nama = 'Pak Slamet', email = 'slamet@cemerlangjaya.test';
end;
$$;
```

---

## 5. Cara Login Setelah Menjalankan Skrip di Atas
1. Buka halaman login: `http://localhost:3000/login`
2. Anda bisa klik salah satu tombol **Akun Demo Cepat** yang ada di bawah form login:
   - Klik **Pak Darto (Owner)**
   - Atau klik **Rina (Admin)**
   - Atau klik **Pak Joko (Mekanik)**
   - Atau klik **Pak Slamet (Mekanik)**
3. Klik tombol merah **Masuk ke Sistem**.
4. Sistem akan langsung mengarahkan Anda ke Dashboard masing-masing role!

