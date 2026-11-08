-- ====================================================================
-- SKEMA DAN MIGRASI DASAR: BENGKEL CEMERLANG JAYA MOTOR
-- Sesuai PRD App 4 - Bootcamp AI Web Programming Sesi 9
-- ====================================================================

-- 1. EXTENSIONS & SCHEMAS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

-- ====================================================================
-- 2. TABEL-TABEL UTAMA (PUBLIC)
-- ====================================================================

-- PROFILES (terhubung 1-1 dengan auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'kepala_mekanik')),
  aktif boolean not null default false,
  created_at timestamptz not null default now()
);

-- MEKANIK (Mekanik sebagai data, tidak memiliki akun login)
create table if not exists public.mekanik (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kepala_mekanik_id uuid not null references public.profiles(id),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- CUSTOMERS (Pelanggan)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tipe text not null default 'perorangan' check (tipe in ('perorangan', 'perusahaan')),
  nama text not null,
  telepon text not null unique check (telepon ~ '^[0-9]{10,14}$'),
  email text,
  alamat text,
  created_at timestamptz not null default now()
);

-- VEHICLES (Kendaraan)
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  plat text not null unique,
  merek_model text not null,
  tahun int check (tahun >= 1980 and tahun <= extract(year from now()) + 1),
  warna text,
  transmisi text check (transmisi in ('AT', 'MT')),
  created_at timestamptz not null default now()
);

-- INVENTORY_ITEMS (Spare part dan Jasa)
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  jenis text not null check (jenis in ('part', 'jasa')),
  nama text not null,
  harga_jual bigint not null check (harga_jual >= 0),
  stok int not null default 0 check (stok >= 0),
  stok_minimum int not null default 5,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- INVENTORY_COSTS (Harga Modal Rahasia - Hanya Owner)
create table if not exists public.inventory_costs (
  item_id uuid primary key references public.inventory_items(id) on delete cascade,
  harga_modal bigint not null check (harga_modal >= 0),
  updated_at timestamptz not null default now()
);

-- NUMBER_COUNTERS (Penomoran WO, INV, SP, JS tanpa ganda)
create table if not exists public.number_counters (
  jenis text not null check (jenis in ('WO', 'INV', 'SP', 'JS')),
  periode text not null,
  terakhir int not null default 0,
  primary key (jenis, periode)
);

-- WORK_ORDERS (Kunjungan mobil & pengerjaan)
create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  nomor text not null unique,
  vehicle_id uuid not null references public.vehicles(id),
  customer_id uuid not null references public.customers(id),
  kepala_mekanik_id uuid not null references public.profiles(id),
  odometer int not null check (odometer >= 0),
  keluhan text not null,
  diagnosis text,
  status text not null default 'menunggu' check (
    status in ('menunggu', 'dikerjakan', 'tertunda', 'selesai', 'siap_diambil', 'diambil', 'dibatalkan')
  ),
  estimasi_selesai date,
  catatan_status text,
  diskon bigint not null default 0 check (diskon >= 0),
  alasan_diskon text,
  selesai_at timestamptz,
  diambil_at timestamptz,
  dibuat_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- WORK_ORDER_MEKANIK (Penugasan mekanik ke WO)
create table if not exists public.work_order_mekanik (
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  mekanik_id uuid not null references public.mekanik(id),
  primary key (work_order_id, mekanik_id)
);

-- WORK_ORDER_PHOTOS (Foto STNK, kondisi awal, pengerjaan, kondisi akhir)
create table if not exists public.work_order_photos (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  jenis text not null check (jenis in ('stnk', 'kondisi_awal', 'kondisi_akhir', 'pengerjaan')),
  path text not null,
  diunggah_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- BILLING_ITEMS (Baris tagihan)
create table if not exists public.billing_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id),
  nama_item text not null,
  jenis text not null check (jenis in ('part', 'jasa')),
  jumlah int not null check (jumlah >= 1),
  harga_master bigint not null check (harga_master >= 0),
  harga_dipakai bigint not null check (harga_dipakai >= 0),
  alasan_penyesuaian text,
  disesuaikan_oleh uuid references public.profiles(id),
  disesuaikan_at timestamptz,
  ditambah_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- BILLING_ITEM_COSTS (Harga modal saat item ditambahkan - Rahasia Owner)
create table if not exists public.billing_item_costs (
  billing_item_id uuid primary key references public.billing_items(id) on delete cascade,
  harga_modal bigint not null default 0 check (harga_modal >= 0)
);

-- INVOICES (Invoice resmi terbit)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null unique references public.work_orders(id),
  nomor text not null unique,
  subtotal bigint not null check (subtotal >= 0),
  diskon bigint not null default 0 check (diskon >= 0),
  total bigint not null check (total >= 0),
  terbayar bigint not null default 0 check (terbayar >= 0),
  status_bayar text not null default 'belum_bayar' check (status_bayar in ('belum_bayar', 'sebagian', 'lunas')),
  diterbitkan_oleh uuid references public.profiles(id),
  diterbitkan_at timestamptz not null default now()
);

-- PAYMENTS (Pembayaran invoice)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id),
  metode text not null check (metode in ('tunai', 'transfer', 'qris')),
  jumlah bigint not null check (jumlah > 0),
  dicatat_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- STOCK_MOVEMENTS (Pergerakan stok)
create table if not exists public.stock_movements (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.inventory_items(id),
  jenis text not null check (jenis in ('masuk', 'keluar', 'kembali', 'penyesuaian')),
  jumlah int not null,
  stok_sesudah int not null,
  keterangan text,
  work_order_id uuid references public.work_orders(id),
  dicatat_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- WO_STATUS_HISTORY (Linimasa status work order)
create table if not exists public.wo_status_history (
  id bigint generated always as identity primary key,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  dari_status text,
  ke_status text not null,
  catatan text,
  oleh uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- AUDIT_LOGS (Catatan riwayat perubahan sistem)
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  waktu timestamptz not null default now(),
  pelaku_id uuid,
  pelaku_peran text,
  aksi text not null,
  tabel text not null,
  data_id text,
  sebelum jsonb,
  sesudah jsonb,
  alasan text
);

-- WORKSHOP_SETTINGS (Pengaturan bengkel, satu baris id=1)
create table if not exists public.workshop_settings (
  id int primary key check (id = 1),
  nama text not null default 'Bengkel Cemerlang Jaya Motor',
  alamat text not null default 'Jl. Raya Otista No. 123, Jakarta Timur',
  telepon text not null default '081234567890',
  jam_buka text not null default 'Senin - Sabtu: 08:00 - 17:00',
  logo_path text,
  galeri_paths text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Pastikan baris 1 workshop_settings ada
insert into public.workshop_settings (id, nama, alamat, telepon, jam_buka)
values (1, 'Bengkel Cemerlang Jaya Motor', 'Jl. Raya Otista No. 123, Jakarta Timur', '081234567890', 'Senin - Sabtu: 08:00 - 17:00')
on conflict (id) do nothing;

-- ====================================================================
-- 3. INDEKS UNTUK KINERJA
-- ====================================================================
create index if not exists idx_wo_status on public.work_orders (status);
create index if not exists idx_wo_kepala_status on public.work_orders (kepala_mekanik_id, status);
create index if not exists idx_wo_created_at on public.work_orders (created_at desc);
create index if not exists idx_vehicles_customer on public.vehicles (customer_id);
create index if not exists idx_billing_wo on public.billing_items (work_order_id);
create index if not exists idx_stock_movements_item on public.stock_movements (item_id, created_at desc);
create index if not exists idx_audit_waktu on public.audit_logs (waktu desc);
create index if not exists idx_payments_invoice on public.payments (invoice_id);

-- ====================================================================
-- 4. FUNGSI BANTUAN DI SKEMA PRIVATE
-- ====================================================================

-- 4.1 private.peran_saya()
create or replace function private.peran_saya()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  select role into v_role
  from public.profiles
  where id = auth.uid() and aktif = true;
  return v_role;
end;
$$;
revoke execute on function private.peran_saya() from public, anon;
grant execute on function private.peran_saya() to authenticated;

-- 4.2 private.tim_wo(p_wo_id uuid)
create or replace function private.tim_wo(p_wo_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tim uuid;
begin
  select kepala_mekanik_id into v_tim
  from public.work_orders
  where id = p_wo_id;
  return v_tim;
end;
$$;
revoke execute on function private.tim_wo(uuid) from public, anon;
grant execute on function private.tim_wo(uuid) to authenticated;

-- 4.3 private.nomor_berikut(jenis text, periode text)
create or replace function private.nomor_berikut(p_jenis text, p_periode text)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_terakhir int;
begin
  insert into public.number_counters (jenis, periode, terakhir)
  values (p_jenis, p_periode, 1)
  on conflict (jenis, periode)
  do update set terakhir = public.number_counters.terakhir + 1
  returning terakhir into v_terakhir;
  return v_terakhir;
end;
$$;
revoke execute on function private.nomor_berikut(text, text) from public, anon;
grant execute on function private.nomor_berikut(text, text) to authenticated;

-- ====================================================================
-- 5. TRIGGER DAN FUNGSI TRIGGER
-- ====================================================================

-- 5.1 updated_at otomatis
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_inventory_items_updated on public.inventory_items;
create trigger trg_inventory_items_updated
before update on public.inventory_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_inventory_costs_updated on public.inventory_costs;
create trigger trg_inventory_costs_updated
before update on public.inventory_costs
for each row execute function public.set_updated_at();

drop trigger if exists trg_work_orders_updated on public.work_orders;
create trigger trg_work_orders_updated
before update on public.work_orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_workshop_settings_updated on public.workshop_settings;
create trigger trg_workshop_settings_updated
before update on public.workshop_settings
for each row execute function public.set_updated_at();

-- 5.2 rapikan_plat pada vehicles
create or replace function public.rapikan_plat()
returns trigger
language plpgsql
as $$
begin
  -- Jadikan huruf kapital dan satukan spasi berlebih
  new.plat = upper(regexp_replace(trim(new.plat), '\s+', ' ', 'g'));
  return new;
end;
$$;

drop trigger if exists trg_vehicles_plat on public.vehicles;
create trigger trg_vehicles_plat
before insert or update of plat on public.vehicles
for each row execute function public.rapikan_plat();

-- 5.3 set_kode_item otomatis bila kosong
create or replace function public.set_kode_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_num int;
begin
  if new.kode is null or trim(new.kode) = '' then
    if new.jenis = 'part' then
      v_num := private.nomor_berikut('SP', '-');
      new.kode := 'SP-' || lpad(v_num::text, 4, '0');
    else
      v_num := private.nomor_berikut('JS', '-');
      new.kode := 'JS-' || lpad(v_num::text, 4, '0');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_inventory_items_kode on public.inventory_items;
create trigger trg_inventory_items_kode
before insert on public.inventory_items
for each row execute function public.set_kode_item();

-- 5.4 trigger on_auth_user_created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nama, email, role, aktif)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'kepala_mekanik'),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 5.5 jaga_profil (Hanya Owner yang boleh ubah role/aktif; Owner terakhir tidak boleh diturunkan/dinonaktifkan)
create or replace function public.jaga_profil()
returns trigger
language plpgsql
as $$
declare
  v_role text;
  v_owner_count int;
begin
  -- Dapatkan peran pemanggil
  select role into v_role from public.profiles where id = auth.uid() and aktif = true;

  -- Jika perubahan menyentuh role atau aktif
  if (old.role is distinct from new.role) or (old.aktif is distinct from new.aktif) then
    if v_role != 'owner' then
      raise exception 'Hanya Owner yang boleh mengubah peran atau status aktif pengguna';
    end if;

    -- Cegah menonaktifkan atau menurunkan role jika merupakan owner terakhir
    if old.role = 'owner' and (new.role != 'owner' or new.aktif = false) then
      select count(*) into v_owner_count from public.profiles where role = 'owner' and aktif = true;
      if v_owner_count <= 1 then
        raise exception 'Tidak dapat mengubah atau menonaktifkan akun Owner terakhir';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_jaga_profil on public.profiles;
create trigger trg_jaga_profil
before update on public.profiles
for each row execute function public.jaga_profil();

-- 5.6 jaga_wo (Membatasi update langsung pada work_orders)
create or replace function public.jaga_wo()
returns trigger
language plpgsql
as $$
declare
  v_role text;
begin
  -- Izinkan jika trigger dipicu dari security definer (current_user != 'authenticated')
  if current_user != 'authenticated' then
    return new;
  end if;

  select role into v_role from public.profiles where id = auth.uid() and aktif = true;

  -- Kolom status TIDAK BOLEH diubah langsung via UPDATE!
  if old.status is distinct from new.status then
    raise exception 'Status Work Order hanya boleh diubah melalui fungsi ubah_status_wo';
  end if;

  -- Periksa kolom yang diizinkan:
  -- Admin / Owner boleh update keluhan, odometer, kepala_mekanik_id saat 'menunggu'
  if v_role in ('owner', 'admin') and old.status = 'menunggu' then
    -- Sah
    return new;
  end if;

  -- Kepala Mekanik tim WO atau Owner boleh update diagnosis saat 'dikerjakan' atau 'tertunda'
  if (v_role = 'owner' or (v_role = 'kepala_mekanik' and old.kepala_mekanik_id = auth.uid()))
     and old.status in ('dikerjakan', 'tertunda') then
    -- Hanya diagnosis yang boleh diubah jika bukan Owner
    if v_role = 'kepala_mekanik' then
      new.keluhan := old.keluhan;
      new.odometer := old.odometer;
      new.kepala_mekanik_id := old.kepala_mekanik_id;
      new.diskon := old.diskon;
      new.alasan_diskon := old.alasan_diskon;
    end if;
    return new;
  end if;

  if v_role = 'owner' then
    return new;
  end if;

  raise exception 'Operasi ubah Work Order tidak diizinkan untuk peran atau status saat ini';
end;
$$;

drop trigger if exists trg_jaga_wo on public.work_orders;
create trigger trg_jaga_wo
before update on public.work_orders
for each row execute function public.jaga_wo();

-- 5.7 catat_audit trigger function
create or replace function public.catat_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_data_id text;
  v_alasan text := null;
  v_sebelum jsonb := null;
  v_sesudah jsonb := null;
begin
  select role into v_role from public.profiles where id = auth.uid();

  if tg_op = 'INSERT' then
    v_sesudah := to_jsonb(new);
    if tg_table_name = 'work_orders' then v_data_id := new.nomor;
    elsif tg_table_name = 'invoices' then v_data_id := new.nomor;
    elsif tg_table_name = 'inventory_items' then v_data_id := new.kode;
    else v_data_id := (new.id)::text; end if;
  elsif tg_op = 'UPDATE' then
    v_sebelum := to_jsonb(old);
    v_sesudah := to_jsonb(new);
    if tg_table_name = 'work_orders' then
      v_data_id := new.nomor;
      v_alasan := coalesce(new.catatan_status, new.alasan_diskon);
    elsif tg_table_name = 'invoices' then v_data_id := new.nomor;
    elsif tg_table_name = 'billing_items' then
      v_data_id := (new.id)::text;
      v_alasan := new.alasan_penyesuaian;
    elsif tg_table_name = 'inventory_items' then v_data_id := new.kode;
    else v_data_id := (new.id)::text; end if;
  elsif tg_op = 'DELETE' then
    v_sebelum := to_jsonb(old);
    if tg_table_name = 'work_orders' then v_data_id := old.nomor;
    elsif tg_table_name = 'invoices' then v_data_id := old.nomor;
    elsif tg_table_name = 'inventory_items' then v_data_id := old.kode;
    else v_data_id := (old.id)::text; end if;
  end if;

  insert into public.audit_logs (
    pelaku_id, pelaku_peran, aksi, tabel, data_id, sebelum, sesudah, alasan
  ) values (
    auth.uid(), v_role, tg_op, tg_table_name, v_data_id, v_sebelum, v_sesudah, v_alasan
  );

  return coalesce(new, old);
end;
$$;

-- Pasang audit triggers
drop trigger if exists trg_audit_work_orders on public.work_orders;
create trigger trg_audit_work_orders
after insert or update or delete on public.work_orders
for each row execute function public.catat_audit();

drop trigger if exists trg_audit_billing_items on public.billing_items;
create trigger trg_audit_billing_items
after insert or update or delete on public.billing_items
for each row execute function public.catat_audit();

drop trigger if exists trg_audit_inventory_items on public.inventory_items;
create trigger trg_audit_inventory_items
after insert or update or delete on public.inventory_items
for each row execute function public.catat_audit();

drop trigger if exists trg_audit_invoices on public.invoices;
create trigger trg_audit_invoices
after insert or update or delete on public.invoices
for each row execute function public.catat_audit();

drop trigger if exists trg_audit_payments on public.payments;
create trigger trg_audit_payments
after insert or update or delete on public.payments
for each row execute function public.catat_audit();

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.catat_audit();

-- ====================================================================
-- 6. DATABASE FUNCTIONS (FUNGSI BISNIS DENGAN TRANSACTION)
-- ====================================================================

-- 6.1 buat_work_order
create or replace function public.buat_work_order(
  p_vehicle_id uuid,
  p_kepala_mekanik_id uuid,
  p_odometer int,
  p_keluhan text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_cust_id uuid;
  v_periode text;
  v_seq int;
  v_nomor text;
  v_wo_id uuid;
begin
  v_role := private.peran_saya();
  if v_role not in ('admin', 'owner') then
    raise exception 'Hanya Admin atau Owner yang boleh membuat Work Order';
  end if;

  if p_odometer < 0 then
    raise exception 'Odometer tidak boleh kurang dari 0';
  end if;

  if trim(coalesce(p_keluhan, '')) = '' then
    raise exception 'Keluhan wajib diisi';
  end if;

  select customer_id into v_cust_id from public.vehicles where id = p_vehicle_id;
  if v_cust_id is null then
    raise exception 'Kendaraan tidak ditemukan';
  end if;

  -- Kunci dan dapatkan nomor urut
  v_periode := to_char(now(), 'YYMM');
  v_seq := private.nomor_berikut('WO', v_periode);
  v_nomor := 'WO-' || v_periode || '-' || lpad(v_seq::text, 4, '0');

  insert into public.work_orders (
    nomor, vehicle_id, customer_id, kepala_mekanik_id, odometer, keluhan, status, dibuat_oleh
  ) values (
    v_nomor, p_vehicle_id, v_cust_id, p_kepala_mekanik_id, p_odometer, p_keluhan, 'menunggu', auth.uid()
  ) returning id into v_wo_id;

  insert into public.wo_status_history (
    work_order_id, dari_status, ke_status, catatan, oleh
  ) values (
    v_wo_id, null, 'menunggu', 'Work Order dibuat', auth.uid()
  );

  return v_wo_id;
end;
$$;
revoke execute on function public.buat_work_order from public, anon;
grant execute on function public.buat_work_order to authenticated;

-- 6.2 tugaskan_mekanik
create or replace function public.tugaskan_mekanik(
  p_wo uuid,
  p_mekanik uuid[],
  p_estimasi date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_tim_id uuid;
  v_status text;
  v_m_id uuid;
  v_m_tim uuid;
  v_m_aktif boolean;
begin
  v_role := private.peran_saya();
  select kepala_mekanik_id, status into v_tim_id, v_status
  from public.work_orders where id = p_wo for update;

  if v_status is null then
    raise exception 'Work Order tidak ditemukan';
  end if;

  if v_status != 'menunggu' then
    raise exception 'Penugasan mekanik hanya boleh saat status Menunggu';
  end if;

  if v_role != 'owner' and (v_role != 'kepala_mekanik' or v_tim_id != auth.uid()) then
    raise exception 'Hanya Kepala Mekanik tim yang bersangkutan atau Owner yang boleh menugaskan mekanik';
  end if;

  if p_estimasi is null or p_estimasi < current_date then
    raise exception 'Estimasi selesai tidak boleh sebelum hari ini';
  end if;

  if cardinality(p_mekanik) = 0 then
    raise exception 'Pilih minimal 1 mekanik';
  end if;

  -- Periksa mekanik harus berasal dari tim bersangkutan dan aktif
  foreach v_m_id in array p_mekanik loop
    select kepala_mekanik_id, aktif into v_m_tim, v_m_aktif
    from public.mekanik where id = v_m_id;

    if v_m_tim is null then
      raise exception 'Mekanik tidak ditemukan';
    end if;

    if v_m_tim != v_tim_id then
      raise exception 'Mekanik harus berasal dari tim yang menangani Work Order ini';
    end if;

    if not v_m_aktif then
      raise exception 'Mekanik yang dipilih sedang tidak aktif';
    end if;
  end loop;

  -- Perbarui penugasan
  delete from public.work_order_mekanik where work_order_id = p_wo;
  foreach v_m_id in array p_mekanik loop
    insert into public.work_order_mekanik (work_order_id, mekanik_id)
    values (p_wo, v_m_id);
  end loop;

  update public.work_orders
  set estimasi_selesai = p_estimasi
  where id = p_wo;
end;
$$;
revoke execute on function public.tugaskan_mekanik from public, anon;
grant execute on function public.tugaskan_mekanik to authenticated;

-- 6.3 ubah_status_wo (State machine resmi)
create or replace function public.ubah_status_wo(
  p_wo uuid,
  p_status text,
  p_catatan text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_wo record;
  v_mekanik_count int;
  v_item_count int;
  v_inv_lunas boolean;
  v_foto_akhir int;
  v_part record;
  v_stok_baru int;
begin
  v_role := private.peran_saya();

  select * into v_wo
  from public.work_orders
  where id = p_wo for update;

  if v_wo.id is null then
    raise exception 'Work Order tidak ditemukan';
  end if;

  -- Cek transisi yang sah berdasarkan Bab 7.2
  -- 1) menunggu -> dikerjakan
  if v_wo.status = 'menunggu' and p_status = 'dikerjakan' then
    if v_role != 'owner' and (v_role != 'kepala_mekanik' or v_wo.kepala_mekanik_id != auth.uid()) then
      raise exception 'Hanya Kepala Mekanik tim WO ini atau Owner yang boleh memulai pengerjaan';
    end if;
    select count(*) into v_mekanik_count from public.work_order_mekanik where work_order_id = p_wo;
    if v_mekanik_count < 1 or v_wo.estimasi_selesai is null then
      raise exception 'Minimal 1 mekanik dan estimasi selesai wajib diisi sebelum mulai pengerjaan';
    end if;

    update public.work_orders set status = 'dikerjakan' where id = p_wo;

  -- 2) dikerjakan -> tertunda
  elsif v_wo.status = 'dikerjakan' and p_status = 'tertunda' then
    if v_role != 'owner' and (v_role != 'kepala_mekanik' or v_wo.kepala_mekanik_id != auth.uid()) then
      raise exception 'Hanya Kepala Mekanik tim WO ini atau Owner yang boleh menunda pengerjaan';
    end if;
    if p_catatan is null or trim(p_catatan) = '' then
      raise exception 'Catatan alasan penundaan wajib diisi';
    end if;

    update public.work_orders
    set status = 'tertunda', catatan_status = trim(p_catatan)
    where id = p_wo;

  -- 3) tertunda -> dikerjakan
  elsif v_wo.status = 'tertunda' and p_status = 'dikerjakan' then
    if v_role != 'owner' and (v_role != 'kepala_mekanik' or v_wo.kepala_mekanik_id != auth.uid()) then
      raise exception 'Hanya Kepala Mekanik tim WO ini atau Owner yang boleh melanjutkan pengerjaan';
    end if;

    update public.work_orders set status = 'dikerjakan' where id = p_wo;

  -- 4) dikerjakan -> selesai
  elsif v_wo.status = 'dikerjakan' and p_status = 'selesai' then
    if v_role != 'owner' and (v_role != 'kepala_mekanik' or v_wo.kepala_mekanik_id != auth.uid()) then
      raise exception 'Hanya Kepala Mekanik tim WO ini atau Owner yang boleh menyelesaikan pengerjaan';
    end if;
    select count(*) into v_item_count from public.billing_items where work_order_id = p_wo;
    if v_item_count < 1 then
      raise exception 'Catat minimal 1 jasa atau spare part sebelum menandai selesai';
    end if;

    update public.work_orders
    set status = 'selesai', selesai_at = now()
    where id = p_wo;

  -- 5) selesai -> siap_diambil (QC Lulus)
  elsif v_wo.status = 'selesai' and p_status = 'siap_diambil' then
    if v_role != 'owner' and (v_role != 'kepala_mekanik' or v_wo.kepala_mekanik_id != auth.uid()) then
      raise exception 'Hanya Kepala Mekanik tim WO ini atau Owner yang boleh melakukan QC';
    end if;

    update public.work_orders
    set status = 'siap_diambil', catatan_status = coalesce(trim(p_catatan), 'QC Lulus')
    where id = p_wo;

  -- 6) selesai -> dikerjakan (QC Gagal)
  elsif v_wo.status = 'selesai' and p_status = 'dikerjakan' then
    if v_role != 'owner' and (v_role != 'kepala_mekanik' or v_wo.kepala_mekanik_id != auth.uid()) then
      raise exception 'Hanya Kepala Mekanik tim WO ini atau Owner yang boleh melakukan QC';
    end if;
    if p_catatan is null or trim(p_catatan) = '' then
      raise exception 'Catatan alasan QC gagal wajib diisi';
    end if;

    update public.work_orders
    set status = 'dikerjakan', selesai_at = null, catatan_status = trim(p_catatan)
    where id = p_wo;

  -- 7) siap_diambil -> diambil
  elsif v_wo.status = 'siap_diambil' and p_status = 'diambil' then
    if v_role not in ('admin', 'owner') then
      raise exception 'Hanya Admin atau Owner yang boleh menyerahkan mobil';
    end if;

    -- Cek invoice lunas
    select (status_bayar = 'lunas') into v_inv_lunas
    from public.invoices where work_order_id = p_wo;
    if v_inv_lunas is distinct from true then
      raise exception 'Mobil hanya boleh diserahkan setelah invoice lunas';
    end if;

    -- Cek foto kondisi akhir minimal 1
    select count(*) into v_foto_akhir
    from public.work_order_photos
    where work_order_id = p_wo and jenis = 'kondisi_akhir';
    if v_foto_akhir < 1 then
      raise exception 'Unggah minimal 1 foto kondisi akhir sebelum menyerahkan mobil';
    end if;

    update public.work_orders
    set status = 'diambil', diambil_at = now()
    where id = p_wo;

  -- 8) pembatalan: menunggu, dikerjakan, tertunda -> dibatalkan
  elsif v_wo.status in ('menunggu', 'dikerjakan', 'tertunda') and p_status = 'dibatalkan' then
    if v_role not in ('admin', 'owner') then
      raise exception 'Hanya Admin atau Owner yang boleh membatalkan Work Order';
    end if;
    if p_catatan is null or trim(p_catatan) = '' then
      raise exception 'Alasan pembatalan wajib diisi';
    end if;

    -- Kembalikan semua stok spare part yang terpakai
    for v_part in (
      select b.item_id, b.jumlah, i.nama
      from public.billing_items b
      join public.inventory_items i on i.id = b.item_id
      where b.work_order_id = p_wo and b.jenis = 'part'
    ) loop
      update public.inventory_items
      set stok = stok + v_part.jumlah
      where id = v_part.item_id
      returning stok into v_stok_baru;

      insert into public.stock_movements (
        item_id, jenis, jumlah, stok_sesudah, keterangan, work_order_id, dicatat_oleh
      ) values (
        v_part.item_id, 'kembali', v_part.jumlah, v_stok_baru,
        'Pengembalian stok pembatalan ' || v_wo.nomor, p_wo, auth.uid()
      );
    end loop;

    update public.work_orders
    set status = 'dibatalkan', catatan_status = trim(p_catatan)
    where id = p_wo;

  else
    raise exception 'Perpindahan status dari % ke % tidak diizinkan', v_wo.status, p_status;
  end if;

  -- Catat riwayat status
  insert into public.wo_status_history (
    work_order_id, dari_status, ke_status, catatan, oleh
  ) values (
    p_wo, v_wo.status, p_status, trim(p_catatan), auth.uid()
  );
end;
$$;
revoke execute on function public.ubah_status_wo from public, anon;
grant execute on function public.ubah_status_wo to authenticated;

-- 6.4 tambah_item_tagihan
create or replace function public.tambah_item_tagihan(
  p_wo uuid,
  p_item uuid,
  p_jumlah int default 1
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_wo record;
  v_item record;
  v_modal bigint := 0;
  v_billing_id uuid;
  v_stok_baru int;
begin
  v_role := private.peran_saya();

  select * into v_wo from public.work_orders where id = p_wo;
  if v_wo.id is null then
    raise exception 'Work Order tidak ditemukan';
  end if;

  if v_wo.status != 'dikerjakan' then
    raise exception 'Item hanya boleh ditambahkan saat status Dikerjakan';
  end if;

  if v_role != 'owner' and (v_role != 'kepala_mekanik' or v_wo.kepala_mekanik_id != auth.uid()) then
    raise exception 'Hanya Kepala Mekanik tim WO ini atau Owner yang boleh menambah item tagihan';
  end if;

  if p_jumlah < 1 then
    raise exception 'Jumlah item minimal 1';
  end if;

  -- Kunci item
  select * into v_item from public.inventory_items where id = p_item for update;
  if v_item.id is null or not v_item.aktif then
    raise exception 'Item tidak ditemukan atau tidak aktif';
  end if;

  if v_item.jenis = 'part' then
    if v_item.stok < p_jumlah then
      raise exception 'Stok % hanya %', v_item.nama, v_item.stok;
    end if;

    update public.inventory_items
    set stok = stok - p_jumlah
    where id = p_item
    returning stok into v_stok_baru;

    insert into public.stock_movements (
      item_id, jenis, jumlah, stok_sesudah, keterangan, work_order_id, dicatat_oleh
    ) values (
      p_item, 'keluar', -p_jumlah, v_stok_baru, 'Pemakaian pada WO ' || v_wo.nomor, p_wo, auth.uid()
    );

    select harga_modal into v_modal from public.inventory_costs where item_id = p_item;
  else
    v_modal := 0;
  end if;

  insert into public.billing_items (
    work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai, ditambah_oleh
  ) values (
    p_wo, p_item, v_item.nama, v_item.jenis, p_jumlah, v_item.harga_jual, v_item.harga_jual, auth.uid()
  ) returning id into v_billing_id;

  insert into public.billing_item_costs (
    billing_item_id, harga_modal
  ) values (
    v_billing_id, coalesce(v_modal, 0)
  );

  return v_billing_id;
end;
$$;
revoke execute on function public.tambah_item_tagihan from public, anon;
grant execute on function public.tambah_item_tagihan to authenticated;

-- 6.5 hapus_item_tagihan
create or replace function public.hapus_item_tagihan(
  p_billing_item uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_b record;
  v_wo record;
  v_stok_baru int;
begin
  v_role := private.peran_saya();

  select * into v_b from public.billing_items where id = p_billing_item;
  if v_b.id is null then
    raise exception 'Baris tagihan tidak ditemukan';
  end if;

  select * into v_wo from public.work_orders where id = v_b.work_order_id;
  if v_wo.status != 'dikerjakan' then
    raise exception 'Item hanya boleh dihapus saat status Dikerjakan';
  end if;

  if v_role != 'owner' and (v_role != 'kepala_mekanik' or v_wo.kepala_mekanik_id != auth.uid()) then
    raise exception 'Hanya Kepala Mekanik tim WO ini atau Owner yang boleh menghapus item tagihan';
  end if;

  if v_b.jenis = 'part' then
    update public.inventory_items
    set stok = stok + v_b.jumlah
    where id = v_b.item_id
    returning stok into v_stok_baru;

    insert into public.stock_movements (
      item_id, jenis, jumlah, stok_sesudah, keterangan, work_order_id, dicatat_oleh
    ) values (
      v_b.item_id, 'kembali', v_b.jumlah, v_stok_baru,
      'Penghapusan item dari ' || v_wo.nomor, v_wo.id, auth.uid()
    );
  end if;

  delete from public.billing_items where id = p_billing_item;
end;
$$;
revoke execute on function public.hapus_item_tagihan from public, anon;
grant execute on function public.hapus_item_tagihan to authenticated;

-- 6.6 sesuaikan_harga_item
create or replace function public.sesuaikan_harga_item(
  p_billing_item uuid,
  p_harga bigint,
  p_alasan text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_b record;
  v_inv_exists boolean;
  v_modal bigint;
  v_di_bawah_modal boolean := false;
begin
  v_role := private.peran_saya();
  if v_role not in ('admin', 'owner') then
    raise exception 'Hanya Admin atau Owner yang boleh menyesuaikan harga';
  end if;

  select * into v_b from public.billing_items where id = p_billing_item;
  if v_b.id is null then
    raise exception 'Baris tagihan tidak ditemukan';
  end if;

  select exists(select 1 from public.invoices where work_order_id = v_b.work_order_id) into v_inv_exists;
  if v_inv_exists then
    raise exception 'Harga tidak bisa disesuaikan karena invoice sudah diterbitkan';
  end if;

  if p_harga < 0 then
    raise exception 'Harga tidak boleh negatif';
  end if;

  if p_harga != v_b.harga_master and (p_alasan is null or trim(p_alasan) = '') then
    raise exception 'Alasan penyesuaian harga wajib diisi';
  end if;

  select coalesce(harga_modal, 0) into v_modal
  from public.billing_item_costs where billing_item_id = p_billing_item;

  if p_harga < v_modal then
    v_di_bawah_modal := true;
  end if;

  update public.billing_items
  set
    harga_dipakai = p_harga,
    alasan_penyesuaian = trim(p_alasan),
    disesuaikan_oleh = auth.uid(),
    disesuaikan_at = now()
  where id = p_billing_item;

  return v_di_bawah_modal;
end;
$$;
revoke execute on function public.sesuaikan_harga_item from public, anon;
grant execute on function public.sesuaikan_harga_item to authenticated;

-- 6.7 atur_diskon
create or replace function public.atur_diskon(
  p_wo uuid,
  p_diskon bigint,
  p_alasan text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_inv_exists boolean;
  v_subtotal bigint;
begin
  v_role := private.peran_saya();
  if v_role not in ('admin', 'owner') then
    raise exception 'Hanya Admin atau Owner yang boleh mengatur diskon';
  end if;

  select exists(select 1 from public.invoices where work_order_id = p_wo) into v_inv_exists;
  if v_inv_exists then
    raise exception 'Diskon tidak bisa diubah karena invoice sudah diterbitkan';
  end if;

  if p_diskon < 0 then
    raise exception 'Diskon tidak boleh kurang dari 0';
  end if;

  select coalesce(sum(jumlah * harga_dipakai), 0) into v_subtotal
  from public.billing_items where work_order_id = p_wo;

  if p_diskon > v_subtotal then
    raise exception 'Diskon tidak boleh melebihi subtotal tagihan';
  end if;

  if p_diskon > 0 and (p_alasan is null or trim(p_alasan) = '') then
    raise exception 'Alasan diskon wajib diisi';
  end if;

  update public.work_orders
  set diskon = p_diskon, alasan_diskon = trim(p_alasan)
  where id = p_wo;
end;
$$;
revoke execute on function public.atur_diskon from public, anon;
grant execute on function public.atur_diskon to authenticated;

-- 6.8 terbitkan_invoice
create or replace function public.terbitkan_invoice(
  p_wo uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_wo record;
  v_inv_exists boolean;
  v_subtotal bigint;
  v_diskon bigint;
  v_total bigint;
  v_periode text;
  v_seq int;
  v_nomor text;
  v_inv_id uuid;
begin
  v_role := private.peran_saya();
  if v_role not in ('admin', 'owner') then
    raise exception 'Hanya Admin atau Owner yang boleh menerbitkan invoice';
  end if;

  select * into v_wo from public.work_orders where id = p_wo for update;
  if v_wo.id is null then
    raise exception 'Work Order tidak ditemukan';
  end if;

  if v_wo.status != 'siap_diambil' then
    raise exception 'Invoice hanya bisa diterbitkan saat status Siap Diambil';
  end if;

  select exists(select 1 from public.invoices where work_order_id = p_wo) into v_inv_exists;
  if v_inv_exists then
    raise exception 'Invoice untuk Work Order ini sudah diterbitkan';
  end if;

  select coalesce(sum(jumlah * harga_dipakai), 0) into v_subtotal
  from public.billing_items where work_order_id = p_wo;

  if v_subtotal = 0 then
    raise exception 'Tidak ada baris tagihan pada Work Order ini';
  end if;

  v_diskon := coalesce(v_wo.diskon, 0);
  v_total := greatest(0, v_subtotal - v_diskon);

  v_periode := to_char(now(), 'YYYYMM');
  v_seq := private.nomor_berikut('INV', v_periode);
  v_nomor := 'INV-' || v_periode || '-' || lpad(v_seq::text, 4, '0');

  insert into public.invoices (
    work_order_id, nomor, subtotal, diskon, total, terbayar, status_bayar, diterbitkan_oleh, diterbitkan_at
  ) values (
    p_wo, v_nomor, v_subtotal, v_diskon, v_total, 0, 'belum_bayar', auth.uid(), now()
  ) returning id into v_inv_id;

  return v_inv_id;
end;
$$;
revoke execute on function public.terbitkan_invoice from public, anon;
grant execute on function public.terbitkan_invoice to authenticated;

-- 6.9 catat_pembayaran
create or replace function public.catat_pembayaran(
  p_invoice uuid,
  p_metode text,
  p_jumlah bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_inv record;
  v_sisa bigint;
  v_terbayar_baru bigint;
  v_status_baru text;
begin
  v_role := private.peran_saya();
  if v_role not in ('admin', 'owner') then
    raise exception 'Hanya Admin atau Owner yang boleh mencatat pembayaran';
  end if;

  if p_metode not in ('tunai', 'transfer', 'qris') then
    raise exception 'Metode pembayaran tidak valid';
  end if;

  if p_jumlah <= 0 then
    raise exception 'Jumlah pembayaran harus lebih dari 0';
  end if;

  select * into v_inv from public.invoices where id = p_invoice for update;
  if v_inv.id is null then
    raise exception 'Invoice tidak ditemukan';
  end if;

  v_sisa := v_inv.total - v_inv.terbayar;
  if p_jumlah > v_sisa then
    raise exception 'Jumlah pembayaran (Rp%) melebihi sisa tagihan (Rp%)', p_jumlah, v_sisa;
  end if;

  insert into public.payments (
    invoice_id, metode, jumlah, dicatat_oleh
  ) values (
    p_invoice, p_metode, p_jumlah, auth.uid()
  );

  v_terbayar_baru := v_inv.terbayar + p_jumlah;
  if v_terbayar_baru >= v_inv.total then
    v_status_baru := 'lunas';
  else
    v_status_baru := 'sebagian';
  end if;

  update public.invoices
  set terbayar = v_terbayar_baru, status_bayar = v_status_baru
  where id = p_invoice;
end;
$$;
revoke execute on function public.catat_pembayaran from public, anon;
grant execute on function public.catat_pembayaran to authenticated;

-- 6.10 catat_stok_masuk
create or replace function public.catat_stok_masuk(
  p_item uuid,
  p_jumlah int,
  p_keterangan text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_item record;
  v_stok_baru int;
begin
  v_role := private.peran_saya();
  if v_role not in ('admin', 'owner') then
    raise exception 'Hanya Admin atau Owner yang boleh mencatat stok masuk';
  end if;

  if p_jumlah < 1 then
    raise exception 'Jumlah stok masuk minimal 1';
  end if;

  select * into v_item from public.inventory_items where id = p_item for update;
  if v_item.id is null then
    raise exception 'Item tidak ditemukan';
  end if;

  if v_item.jenis != 'part' then
    raise exception 'Stok hanya bisa dicatat untuk spare part';
  end if;

  update public.inventory_items
  set stok = stok + p_jumlah
  where id = p_item
  returning stok into v_stok_baru;

  insert into public.stock_movements (
    item_id, jenis, jumlah, stok_sesudah, keterangan, dicatat_oleh
  ) values (
    p_item, 'masuk', p_jumlah, v_stok_baru, trim(p_keterangan), auth.uid()
  );
end;
$$;
revoke execute on function public.catat_stok_masuk from public, anon;
grant execute on function public.catat_stok_masuk to authenticated;

-- 6.11 sesuaikan_stok
create or replace function public.sesuaikan_stok(
  p_item uuid,
  p_stok_fisik int,
  p_alasan text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_item record;
  v_selisih int;
begin
  v_role := private.peran_saya();
  if v_role != 'owner' then
    raise exception 'Hanya Owner yang boleh melakukan penyesuaian stok';
  end if;

  if p_stok_fisik < 0 then
    raise exception 'Stok fisik tidak boleh kurang dari 0';
  end if;

  if p_alasan is null or trim(p_alasan) = '' then
    raise exception 'Alasan penyesuaian stok wajib diisi';
  end if;

  select * into v_item from public.inventory_items where id = p_item for update;
  if v_item.id is null or v_item.jenis != 'part' then
    raise exception 'Spare part tidak ditemukan';
  end if;

  v_selisih := p_stok_fisik - v_item.stok;

  update public.inventory_items
  set stok = p_stok_fisik
  where id = p_item;

  insert into public.stock_movements (
    item_id, jenis, jumlah, stok_sesudah, keterangan, dicatat_oleh
  ) values (
    p_item, 'penyesuaian', v_selisih, p_stok_fisik, trim(p_alasan), auth.uid()
  );
end;
$$;
revoke execute on function public.sesuaikan_stok from public, anon;
grant execute on function public.sesuaikan_stok to authenticated;

-- ====================================================================
-- 7. ATURAN AKSES (ROW LEVEL SECURITY)
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.mekanik enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_costs enable row level security;
alter table public.stock_movements enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_mekanik enable row level security;
alter table public.work_order_photos enable row level security;
alter table public.billing_items enable row level security;
alter table public.billing_item_costs enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.wo_status_history enable row level security;
alter table public.audit_logs enable row level security;
alter table public.number_counters enable row level security;
alter table public.workshop_settings enable row level security;

-- Cabut update kolom stok dari siapapun
revoke update (stok) on public.inventory_items from public, authenticated, anon;

-- PROFILES
create policy "profiles_select_all" on public.profiles
for select using (private.peran_saya() is not null);

create policy "profiles_update_owner_or_self" on public.profiles
for update using (
  private.peran_saya() = 'owner' or id = auth.uid()
);

-- MEKANIK
create policy "mekanik_select_all" on public.mekanik
for select using (private.peran_saya() is not null);

create policy "mekanik_insert_owner_or_kepala" on public.mekanik
for insert with check (
  private.peran_saya() = 'owner' or
  (private.peran_saya() = 'kepala_mekanik' and kepala_mekanik_id = auth.uid())
);

create policy "mekanik_update_owner_or_kepala" on public.mekanik
for update using (
  private.peran_saya() = 'owner' or
  (private.peran_saya() = 'kepala_mekanik' and kepala_mekanik_id = auth.uid())
);

-- CUSTOMERS
create policy "customers_select_all" on public.customers
for select using (private.peran_saya() is not null);

create policy "customers_write_admin_owner" on public.customers
for all using (private.peran_saya() in ('owner', 'admin'));

-- VEHICLES
create policy "vehicles_select_all" on public.vehicles
for select using (private.peran_saya() is not null);

create policy "vehicles_write_admin_owner" on public.vehicles
for all using (private.peran_saya() in ('owner', 'admin'));

-- INVENTORY_ITEMS
create policy "inventory_items_select_all" on public.inventory_items
for select using (private.peran_saya() is not null);

create policy "inventory_items_insert_admin_owner" on public.inventory_items
for insert with check (private.peran_saya() in ('owner', 'admin'));

create policy "inventory_items_update_owner" on public.inventory_items
for update using (private.peran_saya() = 'owner');

-- INVENTORY_COSTS (HANYA OWNER)
create policy "inventory_costs_owner_only" on public.inventory_costs
for all using (private.peran_saya() = 'owner');

-- STOCK_MOVEMENTS (Hanya Select)
create policy "stock_movements_select_all" on public.stock_movements
for select using (private.peran_saya() is not null);

-- WORK_ORDERS
create policy "work_orders_select_all" on public.work_orders
for select using (private.peran_saya() is not null);

create policy "work_orders_update_limited" on public.work_orders
for update using (
  private.peran_saya() = 'owner' or
  (private.peran_saya() = 'admin' and status = 'menunggu') or
  (private.peran_saya() = 'kepala_mekanik' and kepala_mekanik_id = auth.uid() and status in ('dikerjakan', 'tertunda'))
);

-- WORK_ORDER_MEKANIK
create policy "work_order_mekanik_select_all" on public.work_order_mekanik
for select using (private.peran_saya() is not null);

-- WORK_ORDER_PHOTOS
create policy "work_order_photos_select_all" on public.work_order_photos
for select using (private.peran_saya() is not null);

create policy "work_order_photos_insert" on public.work_order_photos
for insert with check (
  private.peran_saya() = 'owner' or
  (private.peran_saya() = 'admin' and jenis in ('stnk', 'kondisi_awal', 'kondisi_akhir')) or
  (private.peran_saya() = 'kepala_mekanik' and jenis = 'pengerjaan')
);

create policy "work_order_photos_delete_owner" on public.work_order_photos
for delete using (private.peran_saya() = 'owner');

-- BILLING_ITEMS
create policy "billing_items_select" on public.billing_items
for select using (
  private.peran_saya() in ('owner', 'admin') or
  (private.peran_saya() = 'kepala_mekanik' and private.tim_wo(work_order_id) = auth.uid())
);

-- BILLING_ITEM_COSTS (HANYA OWNER)
create policy "billing_item_costs_owner_only" on public.billing_item_costs
for select using (private.peran_saya() = 'owner');

-- INVOICES
create policy "invoices_select" on public.invoices
for select using (
  private.peran_saya() in ('owner', 'admin') or
  (private.peran_saya() = 'kepala_mekanik' and private.tim_wo(work_order_id) = auth.uid())
);

-- PAYMENTS
create policy "payments_select" on public.payments
for select using (private.peran_saya() in ('owner', 'admin'));

-- WO_STATUS_HISTORY
create policy "wo_status_history_select_all" on public.wo_status_history
for select using (private.peran_saya() is not null);

-- AUDIT_LOGS (HANYA OWNER)
create policy "audit_logs_owner_only" on public.audit_logs
for select using (private.peran_saya() = 'owner');

-- WORKSHOP_SETTINGS
create policy "workshop_settings_select_all" on public.workshop_settings
for select using (true); -- Izinkan publik untuk halaman depan bengkel

create policy "workshop_settings_update_owner" on public.workshop_settings
for update using (private.peran_saya() = 'owner');

-- ====================================================================
-- 8. STORAGE BUCKETS DAN STORAGE POLICIES
-- ====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('publik', 'publik', true, 1048576, array['image/webp', 'image/jpeg', 'image/png']),
  ('foto-wo', 'foto-wo', false, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policy Storage Publik
drop policy if exists "publik_storage_select" on storage.objects;
create policy "publik_storage_select" on storage.objects
for select using (bucket_id = 'publik');

drop policy if exists "publik_storage_write_owner" on storage.objects;
create policy "publik_storage_write_owner" on storage.objects
for all using (bucket_id = 'publik' and private.peran_saya() = 'owner');

-- Policy Storage Foto-WO
drop policy if exists "fotowo_storage_select" on storage.objects;
create policy "fotowo_storage_select" on storage.objects
for select using (bucket_id = 'foto-wo' and private.peran_saya() is not null);

drop policy if exists "fotowo_storage_insert" on storage.objects;
create policy "fotowo_storage_insert" on storage.objects
for insert with check (
  bucket_id = 'foto-wo' and (
    private.peran_saya() in ('owner', 'admin') or
    private.peran_saya() = 'kepala_mekanik'
  )
);

drop policy if exists "fotowo_storage_delete_owner" on storage.objects;
create policy "fotowo_storage_delete_owner" on storage.objects
for delete using (bucket_id = 'foto-wo' and private.peran_saya() = 'owner');

