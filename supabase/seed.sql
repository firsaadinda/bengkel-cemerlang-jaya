-- ====================================================================
-- SEED DATA CONTOH: BENGKEL CEMERLANG JAYA MOTOR
-- Sesuai PRD App 4 - Bootcamp AI Web Programming Sesi 9
-- ====================================================================

-- 1. AKUN UJI DAN PROFIL
-- Buat akun di auth.users dengan kata sandi "Bengkel123!"
-- UUID deterministik untuk 4 user:
-- Pak Darto (Owner): 11111111-1111-1111-1111-111111111111
-- Rina (Admin): 22222222-2222-2222-2222-222222222222
-- Pak Joko (Kepala Mekanik Tim A): 33333333-3333-3333-3333-333333333333
-- Pak Slamet (Kepala Mekanik Tim B): 44444444-4444-4444-4444-444444444444

do $$
declare
  v_enc_pass text;
begin
  v_enc_pass := crypt('Bengkel123!', gen_salt('bf'));

  -- Pak Darto (Owner)
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@cemerlangjaya.test', v_enc_pass, now(), '{"provider":"email","providers":["email"]}', '{"nama":"Pak Darto","role":"owner"}', now(), now())
  on conflict (id) do update set encrypted_password = v_enc_pass;

  insert into public.profiles (id, nama, email, role, aktif)
  values ('11111111-1111-1111-1111-111111111111', 'Pak Darto', 'owner@cemerlangjaya.test', 'owner', true)
  on conflict (id) do update set role = 'owner', aktif = true, nama = 'Pak Darto';

  -- Rina (Admin)
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@cemerlangjaya.test', v_enc_pass, now(), '{"provider":"email","providers":["email"]}', '{"nama":"Rina","role":"admin"}', now(), now())
  on conflict (id) do update set encrypted_password = v_enc_pass;

  insert into public.profiles (id, nama, email, role, aktif)
  values ('22222222-2222-2222-2222-222222222222', 'Rina', 'admin@cemerlangjaya.test', 'admin', true)
  on conflict (id) do update set role = 'admin', aktif = true, nama = 'Rina';

  -- Pak Joko (Kepala Mekanik Tim A)
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'joko@cemerlangjaya.test', v_enc_pass, now(), '{"provider":"email","providers":["email"]}', '{"nama":"Pak Joko (Tim A)","role":"kepala_mekanik"}', now(), now())
  on conflict (id) do update set encrypted_password = v_enc_pass;

  insert into public.profiles (id, nama, email, role, aktif)
  values ('33333333-3333-3333-3333-333333333333', 'Pak Joko', 'joko@cemerlangjaya.test', 'kepala_mekanik', true)
  on conflict (id) do update set role = 'kepala_mekanik', aktif = true, nama = 'Pak Joko';

  -- Pak Slamet (Kepala Mekanik Tim B)
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'slamet@cemerlangjaya.test', v_enc_pass, now(), '{"provider":"email","providers":["email"]}', '{"nama":"Pak Slamet (Tim B)","role":"kepala_mekanik"}', now(), now())
  on conflict (id) do update set encrypted_password = v_enc_pass;

  insert into public.profiles (id, nama, email, role, aktif)
  values ('44444444-4444-4444-4444-444444444444', 'Pak Slamet', 'slamet@cemerlangjaya.test', 'kepala_mekanik', true)
  on conflict (id) do update set role = 'kepala_mekanik', aktif = true, nama = 'Pak Slamet';
end $$;

-- 2. MEKANIK
insert into public.mekanik (id, nama, kepala_mekanik_id, aktif) values
  ('a1111111-1111-1111-1111-111111111111', 'Andi', '33333333-3333-3333-3333-333333333333', true),
  ('a2222222-2222-2222-2222-222222222222', 'Bayu', '33333333-3333-3333-3333-333333333333', true),
  ('b1111111-1111-1111-1111-111111111111', 'Dedi', '44444444-4444-4444-4444-444444444444', true),
  ('b2222222-2222-2222-2222-222222222222', 'Eko',  '44444444-4444-4444-4444-444444444444', true)
on conflict (id) do update set nama = excluded.nama, aktif = true;

-- 3. INVENTORY ITEMS (SPARE PART 10 + JASA 6)
insert into public.inventory_items (id, kode, jenis, nama, harga_jual, stok, stok_minimum, aktif) values
  ('c0000001-0000-0000-0000-000000000001', 'SP-0001', 'part', 'Oli Mesin 4L', 450000, 20, 5, true),
  ('c0000001-0000-0000-0000-000000000002', 'SP-0002', 'part', 'Filter Oli', 75000, 15, 5, true),
  ('c0000001-0000-0000-0000-000000000003', 'SP-0003', 'part', 'Kampas Rem Depan', 350000, 6, 5, true),
  ('c0000001-0000-0000-0000-000000000004', 'SP-0004', 'part', 'Aki 45Ah', 950000, 2, 5, true),
  ('c0000001-0000-0000-0000-000000000005', 'SP-0005', 'part', 'Busi Iridium', 120000, 24, 5, true),
  ('c0000001-0000-0000-0000-000000000006', 'SP-0006', 'part', 'Filter Udara', 110000, 8, 5, true),
  ('c0000001-0000-0000-0000-000000000007', 'SP-0007', 'part', 'Minyak Rem', 65000, 4, 5, true),
  ('c0000001-0000-0000-0000-000000000008', 'SP-0008', 'part', 'V-Belt', 280000, 3, 5, true),
  ('c0000001-0000-0000-0000-000000000009', 'SP-0009', 'part', 'Wiper Blade', 95000, 10, 5, true),
  ('c0000001-0000-0000-0000-000000000010', 'SP-0010', 'part', 'Lampu H4', 85000, 1, 5, true),

  ('d0000001-0000-0000-0000-000000000001', 'JS-0001', 'jasa', 'Ganti Oli', 50000, 0, 0, true),
  ('d0000001-0000-0000-0000-000000000002', 'JS-0002', 'jasa', 'Tune-up', 350000, 0, 0, true),
  ('d0000001-0000-0000-0000-000000000003', 'JS-0003', 'jasa', 'Servis Rem', 150000, 0, 0, true),
  ('d0000001-0000-0000-0000-000000000004', 'JS-0004', 'jasa', 'Spooring dan Balancing', 250000, 0, 0, true),
  ('d0000001-0000-0000-0000-000000000005', 'JS-0005', 'jasa', 'Cek Kelistrikan', 100000, 0, 0, true),
  ('d0000001-0000-0000-0000-000000000006', 'JS-0006', 'jasa', 'Servis AC', 300000, 0, 0, true)
on conflict (id) do nothing;

-- 4. INVENTORY COSTS (HARGA MODAL SPARE PART)
insert into public.inventory_costs (item_id, harga_modal) values
  ('c0000001-0000-0000-0000-000000000001', 360000),
  ('c0000001-0000-0000-0000-000000000002', 50000),
  ('c0000001-0000-0000-0000-000000000003', 260000),
  ('c0000001-0000-0000-0000-000000000004', 780000),
  ('c0000001-0000-0000-0000-000000000005', 85000),
  ('c0000001-0000-0000-0000-000000000006', 70000),
  ('c0000001-0000-0000-0000-000000000007', 40000),
  ('c0000001-0000-0000-0000-000000000008', 200000),
  ('c0000001-0000-0000-0000-000000000009', 60000),
  ('c0000001-0000-0000-0000-000000000010', 55000)
on conflict (item_id) do update set harga_modal = excluded.harga_modal;

-- Update number counters for initial parts & services
insert into public.number_counters (jenis, periode, terakhir)
values ('SP', '-', 10), ('JS', '-', 6)
on conflict (jenis, periode) do update set terakhir = greatest(excluded.terakhir, public.number_counters.terakhir);

-- 5. PELANGGAN DAN KENDARAAN
insert into public.customers (id, tipe, nama, telepon, email, alamat) values
  ('e0000001-0000-0000-0000-000000000001', 'perorangan', 'Budi Santoso', '081234567801', 'budi@gmail.com', 'Jl. Melati No. 12, Jakarta Timur'),
  ('e0000001-0000-0000-0000-000000000002', 'perusahaan', 'PT Cipta Mandiri', '081298765402', 'finance@ciptamandiri.co.id', 'Sudirman Office Park Kav. 5, Jakarta Selatan'),
  ('e0000001-0000-0000-0000-000000000003', 'perorangan', 'Siti Rahma', '085712345603', 'siti.rahma@yahoo.com', 'Jl. Anggrek No. 45, Bekasi'),
  ('e0000001-0000-0000-0000-000000000004', 'perorangan', 'Hendra Wijaya', '087812345604', 'hendra.w@gmail.com', 'Jl. Kenanga No. 7, Jakarta Barat'),
  ('e0000001-0000-0000-0000-000000000005', 'perorangan', 'Dewi Lestari', '081312345605', 'dewi.lestari@gmail.com', 'Jl. Dahlia No. 19, Depok')
on conflict (id) do nothing;

insert into public.vehicles (id, customer_id, plat, merek_model, tahun, warna, transmisi) values
  ('f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'B 1234 ABC', 'Toyota Avanza 1.3 G', 2020, 'Hitam', 'MT'),
  ('f0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000001', 'B 2345 BCD', 'Honda Brio E', 2022, 'Putih', 'AT'),
  ('f0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000001', 'B 3456 CDE', 'Mitsubishi Xpander Ultimate', 2021, 'Abu-abu', 'AT'),
  ('f0000001-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000002', 'B 9876 CDE', 'Daihatsu Gran Max Pick Up', 2019, 'Putih', 'MT'),
  ('f0000001-0000-0000-0000-000000000005', 'e0000001-0000-0000-0000-000000000003', 'B 4567 EFG', 'Suzuki Ertiga GL', 2018, 'Silver', 'MT'),
  ('f0000001-0000-0000-0000-000000000006', 'e0000001-0000-0000-0000-000000000004', 'B 5678 GHI', 'Toyota Innova Reborn 2.4 V', 2021, 'Hitam', 'AT'),
  ('f0000001-0000-0000-0000-000000000007', 'e0000001-0000-0000-0000-000000000005', 'B 6789 IJK', 'Honda HR-V 1.5 E', 2022, 'Merah', 'AT')
on conflict (id) do nothing;

-- 6. WORK ORDERS CONTOH (12 WO)
-- 5 diambil (invoice lunas)
-- 1 dibatalkan
-- 2 siap diambil (1 invoice sebagian, 1 belum ditagih)
-- 1 selesai menunggu QC
-- 1 dikerjakan (terlambat)
-- 1 tertunda (terlambat)
-- 1 menunggu

insert into public.work_orders (
  id, nomor, vehicle_id, customer_id, kepala_mekanik_id, odometer, keluhan, diagnosis,
  status, estimasi_selesai, catatan_status, diskon, alasan_diskon, selesai_at, diambil_at, dibuat_oleh, created_at
) values
  -- 1) Diambil & Lunas (WO-2610-0001)
  ('10000000-0000-0000-0000-000000000001', 'WO-2610-0001', 'f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 45200, 'Ganti oli rutin dan rem depan bunyi', 'Kampas rem aus, oli mesin hitam', 'diambil', current_date - 20, 'QC Lulus', 0, null, now() - interval '20 days', now() - interval '19 days', '22222222-2222-2222-2222-222222222222', now() - interval '21 days'),
  -- 2) Diambil & Lunas (WO-2610-0002)
  ('10000000-0000-0000-0000-000000000002', 'WO-2610-0002', 'f0000001-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 88400, 'Mesin brebet dan AC kurang dingin', 'Busi kotor aus, freon normal butuh servis AC', 'diambil', current_date - 15, 'QC Lulus', 50000, 'Diskon pelanggan armada perusahaan', now() - interval '15 days', now() - interval '14 days', '22222222-2222-2222-2222-222222222222', now() - interval '16 days'),
  -- 3) Diambil & Lunas (WO-2610-0003)
  ('10000000-0000-0000-0000-000000000003', 'WO-2610-0003', 'f0000001-0000-0000-0000-000000000005', 'e0000001-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 62100, 'Ganti oli dan filter oli', 'Kondisi umum sehat', 'diambil', current_date - 10, 'QC Lulus', 0, null, now() - interval '10 days', now() - interval '9 days', '22222222-2222-2222-2222-222222222222', now() - interval '11 days'),
  -- 4) Diambil & Lunas (WO-2610-0004)
  ('10000000-0000-0000-0000-000000000004', 'WO-2610-0004', 'f0000001-0000-0000-0000-000000000006', 'e0000001-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 32000, 'Spooring balancing dan wiper bergetar', 'Wiper getas, roda depan tidak presisi', 'diambil', current_date - 6, 'QC Lulus', 0, null, now() - interval '6 days', now() - interval '5 days', '22222222-2222-2222-2222-222222222222', now() - interval '7 days'),
  -- 5) Diambil & Lunas (WO-2610-0005)
  ('10000000-0000-0000-0000-000000000005', 'WO-2610-0005', 'f0000001-0000-0000-0000-000000000007', 'e0000001-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 21500, 'Aki sering drop, lampu redup', 'Aki soak butuh penggantian', 'diambil', current_date - 2, 'QC Lulus', 0, null, now() - interval '2 days', now() - interval '1 day', '22222222-2222-2222-2222-222222222222', now() - interval '3 days'),

  -- 6) Dibatalkan (WO-2610-0006)
  ('10000000-0000-0000-0000-000000000006', 'WO-2610-0006', 'f0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 19000, 'Bunyi mendecit di ruang mesin', 'V-belt kendor', 'dibatalkan', current_date - 4, 'Pelanggan ada keperluan mendadak keluar kota', 0, null, null, null, '22222222-2222-2222-2222-222222222222', now() - interval '5 days'),

  -- 7) Siap Diambil, Invoice Sebagian (WO-2610-0007)
  ('10000000-0000-0000-0000-000000000007', 'WO-2610-0007', 'f0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 39000, 'Tune-up berkala dan servis rem', 'Sistem rem kotor berdebu', 'siap_diambil', current_date - 1, 'QC Lulus', 0, null, now() - interval '1 day', null, '22222222-2222-2222-2222-222222222222', now() - interval '2 days'),

  -- 8) Siap Diambil, Belum Ditagih (WO-2610-0008)
  ('10000000-0000-0000-0000-000000000008', 'WO-2610-0008', 'f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 46500, 'Lampu utama mati sebelah', 'Bohlam H4 putus', 'siap_diambil', current_date, 'QC Lulus', 0, null, now() - interval '3 hours', null, '22222222-2222-2222-2222-222222222222', now() - interval '1 day'),

  -- 9) Selesai Menunggu QC (WO-2610-0009)
  ('10000000-0000-0000-0000-000000000009', 'WO-2610-0009', 'f0000001-0000-0000-0000-000000000005', 'e0000001-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 63000, 'Ganti V-belt dan ganti oli', 'V-belt retak halus', 'selesai', current_date, null, 0, null, now() - interval '1 hour', null, '22222222-2222-2222-2222-222222222222', now() - interval '1 day'),

  -- 10) Dikerjakan (Terlambat) (WO-2610-0010)
  ('10000000-0000-0000-0000-000000000010', 'WO-2610-0010', 'f0000001-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 89200, 'Overhaul rem dan servis total', 'Piston kaliper agak macet', 'dikerjakan', current_date - 1, null, 0, null, null, null, '22222222-2222-2222-2222-222222222222', now() - interval '3 days'),

  -- 11) Tertunda (Terlambat) (WO-2610-0011)
  ('10000000-0000-0000-0000-000000000011', 'WO-2610-0011', 'f0000001-0000-0000-0000-000000000006', 'e0000001-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 33100, 'Bunyi kasar dari roda belakang', 'Bearing roda aus', 'tertunda', current_date - 2, 'Menunggu part bearing khusus dipesan dari pusat', 0, null, null, null, '22222222-2222-2222-2222-222222222222', now() - interval '4 days'),

  -- 12) Menunggu (WO-2610-0012)
  ('10000000-0000-0000-0000-000000000012', 'WO-2610-0012', 'f0000001-0000-0000-0000-000000000007', 'e0000001-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 22100, 'Tarikan loyo saat tanjakan', null, 'menunggu', null, null, 0, null, null, null, '22222222-2222-2222-2222-222222222222', now() - interval '2 hours')
on conflict (id) do nothing;

-- Update number counter for WO
insert into public.number_counters (jenis, periode, terakhir)
values ('WO', to_char(now(), 'YYMM'), 12)
on conflict (jenis, periode) do update set terakhir = greatest(excluded.terakhir, public.number_counters.terakhir);

-- 7. PENUGASAN MEKANIK PADA WO
insert into public.work_order_mekanik (work_order_id, mekanik_id) values
  ('10000000-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111'),
  ('10000000-0000-0000-0000-000000000002', 'b1111111-1111-1111-1111-111111111111'),
  ('10000000-0000-0000-0000-000000000003', 'a2222222-2222-2222-2222-222222222222'),
  ('10000000-0000-0000-0000-000000000004', 'b2222222-2222-2222-2222-222222222222'),
  ('10000000-0000-0000-0000-000000000005', 'a1111111-1111-1111-1111-111111111111'),
  ('10000000-0000-0000-0000-000000000007', 'a1111111-1111-1111-1111-111111111111'),
  ('10000000-0000-0000-0000-000000000007', 'a2222222-2222-2222-2222-222222222222'),
  ('10000000-0000-0000-0000-000000000008', 'b1111111-1111-1111-1111-111111111111'),
  ('10000000-0000-0000-0000-000000000009', 'a2222222-2222-2222-2222-222222222222'),
  ('10000000-0000-0000-0000-000000000010', 'b1111111-1111-1111-1111-111111111111'),
  ('10000000-0000-0000-0000-000000000011', 'a1111111-1111-1111-1111-111111111111')
on conflict (work_order_id, mekanik_id) do nothing;

-- 8. BARIS TAGIHAN & HARGA MODAL
-- WO 1
insert into public.billing_items (id, work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai, ditambah_oleh, created_at) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Oli Mesin 4L', 'part', 1, 450000, 450000, '33333333-3333-3333-3333-333333333333', now() - interval '20 days'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000003', 'Kampas Rem Depan', 'part', 1, 350000, 350000, '33333333-3333-3333-3333-333333333333', now() - interval '20 days'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'Ganti Oli', 'jasa', 1, 50000, 50000, '33333333-3333-3333-3333-333333333333', now() - interval '20 days'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 'Servis Rem', 'jasa', 1, 150000, 150000, '33333333-3333-3333-3333-333333333333', now() - interval '20 days')
on conflict (id) do nothing;

insert into public.billing_item_costs (billing_item_id, harga_modal) values
  ('20000000-0000-0000-0000-000000000001', 360000),
  ('20000000-0000-0000-0000-000000000002', 260000),
  ('20000000-0000-0000-0000-000000000003', 0),
  ('20000000-0000-0000-0000-000000000004', 0)
on conflict (billing_item_id) do nothing;

-- WO 2
insert into public.billing_items (id, work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai, alasan_penyesuaian, disesuaikan_oleh, ditambah_oleh, created_at) values
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000005', 'Busi Iridium', 'part', 4, 120000, 110000, 'Harga khusus armada perusahaan', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', now() - interval '15 days'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000002', 'Tune-up', 'jasa', 1, 350000, 350000, null, null, '44444444-4444-4444-4444-444444444444', now() - interval '15 days'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000006', 'Servis AC', 'jasa', 1, 300000, 300000, null, null, '44444444-4444-4444-4444-444444444444', now() - interval '15 days')
on conflict (id) do nothing;

insert into public.billing_item_costs (billing_item_id, harga_modal) values
  ('20000000-0000-0000-0000-000000000005', 85000),
  ('20000000-0000-0000-0000-000000000006', 0),
  ('20000000-0000-0000-0000-000000000007', 0)
on conflict (billing_item_id) do nothing;

-- WO 3
insert into public.billing_items (id, work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai, ditambah_oleh, created_at) values
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'Oli Mesin 4L', 'part', 1, 450000, 450000, '33333333-3333-3333-3333-333333333333', now() - interval '10 days'),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000002', 'Filter Oli', 'part', 1, 75000, 75000, '33333333-3333-3333-3333-333333333333', now() - interval '10 days'),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001', 'Ganti Oli', 'jasa', 1, 50000, 50000, '33333333-3333-3333-3333-333333333333', now() - interval '10 days')
on conflict (id) do nothing;

insert into public.billing_item_costs (billing_item_id, harga_modal) values
  ('20000000-0000-0000-0000-000000000008', 360000),
  ('20000000-0000-0000-0000-000000000009', 50000),
  ('20000000-0000-0000-0000-000000000010', 0)
on conflict (billing_item_id) do nothing;

-- WO 4
insert into public.billing_items (id, work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai, ditambah_oleh, created_at) values
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000009', 'Wiper Blade', 'part', 2, 95000, 95000, '44444444-4444-4444-4444-444444444444', now() - interval '6 days'),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000004', 'Spooring dan Balancing', 'jasa', 1, 250000, 250000, '44444444-4444-4444-4444-444444444444', now() - interval '6 days')
on conflict (id) do nothing;

insert into public.billing_item_costs (billing_item_id, harga_modal) values
  ('20000000-0000-0000-0000-000000000011', 60000),
  ('20000000-0000-0000-0000-000000000012', 0)
on conflict (billing_item_id) do nothing;

-- WO 5
insert into public.billing_items (id, work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai, ditambah_oleh, created_at) values
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000004', 'Aki 45Ah', 'part', 1, 950000, 950000, '33333333-3333-3333-3333-333333333333', now() - interval '2 days'),
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000005', 'Cek Kelistrikan', 'jasa', 1, 100000, 100000, '33333333-3333-3333-3333-333333333333', now() - interval '2 days')
on conflict (id) do nothing;

insert into public.billing_item_costs (billing_item_id, harga_modal) values
  ('20000000-0000-0000-0000-000000000013', 780000),
  ('20000000-0000-0000-0000-000000000014', 0)
on conflict (billing_item_id) do nothing;

-- WO 7 (Siap diambil, invoice sebagian)
insert into public.billing_items (id, work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai, ditambah_oleh, created_at) values
  ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000006', 'Filter Udara', 'part', 1, 110000, 110000, '33333333-3333-3333-3333-333333333333', now() - interval '1 day'),
  ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000007', 'd0000001-0000-0000-0000-000000000002', 'Tune-up', 'jasa', 1, 350000, 350000, '33333333-3333-3333-3333-333333333333', now() - interval '1 day'),
  ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000007', 'd0000001-0000-0000-0000-000000000003', 'Servis Rem', 'jasa', 1, 150000, 150000, '33333333-3333-3333-3333-333333333333', now() - interval '1 day')
on conflict (id) do nothing;

insert into public.billing_item_costs (billing_item_id, harga_modal) values
  ('20000000-0000-0000-0000-000000000015', 70000),
  ('20000000-0000-0000-0000-000000000016', 0),
  ('20000000-0000-0000-0000-000000000017', 0)
on conflict (billing_item_id) do nothing;

-- WO 8 (Siap diambil, belum terbit invoice)
insert into public.billing_items (id, work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai, ditambah_oleh, created_at) values
  ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000010', 'Lampu H4', 'part', 1, 85000, 85000, '44444444-4444-4444-4444-444444444444', now() - interval '4 hours')
on conflict (id) do nothing;

insert into public.billing_item_costs (billing_item_id, harga_modal) values
  ('20000000-0000-0000-0000-000000000018', 55000)
on conflict (billing_item_id) do nothing;

-- WO 9 (Selesai pengerjaan)
insert into public.billing_items (id, work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai, ditambah_oleh, created_at) values
  ('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000008', 'V-Belt', 'part', 1, 280000, 280000, '33333333-3333-3333-3333-333333333333', now() - interval '2 hours'),
  ('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000001', 'Oli Mesin 4L', 'part', 1, 450000, 450000, '33333333-3333-3333-3333-333333333333', now() - interval '2 hours'),
  ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000009', 'd0000001-0000-0000-0000-000000000001', 'Ganti Oli', 'jasa', 1, 50000, 50000, '33333333-3333-3333-3333-333333333333', now() - interval '2 hours')
on conflict (id) do nothing;

insert into public.billing_item_costs (billing_item_id, harga_modal) values
  ('20000000-0000-0000-0000-000000000019', 200000),
  ('20000000-0000-0000-0000-000000000020', 360000),
  ('20000000-0000-0000-0000-000000000021', 0)
on conflict (billing_item_id) do nothing;

-- WO 10 (Dikerjakan)
insert into public.billing_items (id, work_order_id, item_id, nama_item, jenis, jumlah, harga_master, harga_dipakai, ditambah_oleh, created_at) values
  ('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000010', 'c0000001-0000-0000-0000-000000000007', 'Minyak Rem', 'part', 1, 65000, 65000, '44444444-4444-4444-4444-444444444444', now() - interval '1 day'),
  ('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000010', 'd0000001-0000-0000-0000-000000000003', 'Servis Rem', 'jasa', 1, 150000, 150000, '44444444-4444-4444-4444-444444444444', now() - interval '1 day')
on conflict (id) do nothing;

insert into public.billing_item_costs (billing_item_id, harga_modal) values
  ('20000000-0000-0000-0000-000000000022', 40000),
  ('20000000-0000-0000-0000-000000000023', 0)
on conflict (billing_item_id) do nothing;

-- 9. INVOICES DAN PEMBAYARAN
insert into public.invoices (id, work_order_id, nomor, subtotal, diskon, total, terbayar, status_bayar, diterbitkan_oleh, diterbitkan_at) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'INV-202610-0001', 1000000, 0, 1000000, 1000000, 'lunas', '22222222-2222-2222-2222-222222222222', now() - interval '20 days'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'INV-202610-0002', 1090000, 50000, 1040000, 1040000, 'lunas', '22222222-2222-2222-2222-222222222222', now() - interval '15 days'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'INV-202610-0003', 575000, 0, 575000, 575000, 'lunas', '22222222-2222-2222-2222-222222222222', now() - interval '10 days'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'INV-202610-0004', 440000, 0, 440000, 440000, 'lunas', '22222222-2222-2222-2222-222222222222', now() - interval '6 days'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'INV-202610-0005', 1050000, 0, 1050000, 1050000, 'lunas', '22222222-2222-2222-2222-222222222222', now() - interval '2 days'),
  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'INV-202610-0006', 610000, 0, 610000, 300000, 'sebagian', '22222222-2222-2222-2222-222222222222', now() - interval '1 day')
on conflict (id) do nothing;

insert into public.payments (id, invoice_id, metode, jumlah, dicatat_oleh, created_at) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'transfer', 1000000, '22222222-2222-2222-2222-222222222222', now() - interval '19 days'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'transfer', 1040000, '22222222-2222-2222-2222-222222222222', now() - interval '14 days'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'qris', 575000, '22222222-2222-2222-2222-222222222222', now() - interval '9 days'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'tunai', 440000, '22222222-2222-2222-2222-222222222222', now() - interval '5 days'),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'qris', 1050000, '22222222-2222-2222-2222-222222222222', now() - interval '1 day'),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000007', 'tunai', 300000, '22222222-2222-2222-2222-222222222222', now() - interval '1 day')
on conflict (id) do nothing;

-- Update number counter for INV
insert into public.number_counters (jenis, periode, terakhir)
values ('INV', to_char(now(), 'YYYYMM'), 6)
on conflict (jenis, periode) do update set terakhir = greatest(excluded.terakhir, public.number_counters.terakhir);

-- 10. FOTO WO CONTOH (Untuk memenuhi syarat diambil)
insert into public.work_order_photos (work_order_id, jenis, path, diunggah_oleh, created_at) values
  ('10000000-0000-0000-0000-000000000001', 'stnk', '10000000-0000-0000-0000-000000000001/stnk/sample-stnk.webp', '22222222-2222-2222-2222-222222222222', now() - interval '21 days'),
  ('10000000-0000-0000-0000-000000000001', 'kondisi_awal', '10000000-0000-0000-0000-000000000001/kondisi_awal/sample-awal.webp', '22222222-2222-2222-2222-222222222222', now() - interval '21 days'),
  ('10000000-0000-0000-0000-000000000001', 'kondisi_akhir', '10000000-0000-0000-0000-000000000001/kondisi_akhir/sample-akhir.webp', '22222222-2222-2222-2222-222222222222', now() - interval '19 days'),

  ('10000000-0000-0000-0000-000000000002', 'stnk', '10000000-0000-0000-0000-000000000002/stnk/sample-stnk.webp', '22222222-2222-2222-2222-222222222222', now() - interval '16 days'),
  ('10000000-0000-0000-0000-000000000002', 'kondisi_awal', '10000000-0000-0000-0000-000000000002/kondisi_awal/sample-awal.webp', '22222222-2222-2222-2222-222222222222', now() - interval '16 days'),
  ('10000000-0000-0000-0000-000000000002', 'kondisi_akhir', '10000000-0000-0000-0000-000000000002/kondisi_akhir/sample-akhir.webp', '22222222-2222-2222-2222-222222222222', now() - interval '14 days'),

  ('10000000-0000-0000-0000-000000000003', 'stnk', '10000000-0000-0000-0000-000000000003/stnk/sample-stnk.webp', '22222222-2222-2222-2222-222222222222', now() - interval '11 days'),
  ('10000000-0000-0000-0000-000000000003', 'kondisi_awal', '10000000-0000-0000-0000-000000000003/kondisi_awal/sample-awal.webp', '22222222-2222-2222-2222-222222222222', now() - interval '11 days'),
  ('10000000-0000-0000-0000-000000000003', 'kondisi_akhir', '10000000-0000-0000-0000-000000000003/kondisi_akhir/sample-akhir.webp', '22222222-2222-2222-2222-222222222222', now() - interval '9 days'),

  ('10000000-0000-0000-0000-000000000004', 'stnk', '10000000-0000-0000-0000-000000000004/stnk/sample-stnk.webp', '22222222-2222-2222-2222-222222222222', now() - interval '7 days'),
  ('10000000-0000-0000-0000-000000000004', 'kondisi_awal', '10000000-0000-0000-0000-000000000004/kondisi_awal/sample-awal.webp', '22222222-2222-2222-2222-222222222222', now() - interval '7 days'),
  ('10000000-0000-0000-0000-000000000004', 'kondisi_akhir', '10000000-0000-0000-0000-000000000004/kondisi_akhir/sample-akhir.webp', '22222222-2222-2222-2222-222222222222', now() - interval '5 days'),

  ('10000000-0000-0000-0000-000000000005', 'stnk', '10000000-0000-0000-0000-000000000005/stnk/sample-stnk.webp', '22222222-2222-2222-2222-222222222222', now() - interval '3 days'),
  ('10000000-0000-0000-0000-000000000005', 'kondisi_awal', '10000000-0000-0000-0000-000000000005/kondisi_awal/sample-awal.webp', '22222222-2222-2222-2222-222222222222', now() - interval '3 days'),
  ('10000000-0000-0000-0000-000000000005', 'kondisi_akhir', '10000000-0000-0000-0000-000000000005/kondisi_akhir/sample-akhir.webp', '22222222-2222-2222-2222-222222222222', now() - interval '1 day'),

  ('10000000-0000-0000-0000-000000000007', 'stnk', '10000000-0000-0000-0000-000000000007/stnk/sample-stnk.webp', '22222222-2222-2222-2222-222222222222', now() - interval '2 days'),
  ('10000000-0000-0000-0000-000000000007', 'kondisi_awal', '10000000-0000-0000-0000-000000000007/kondisi_awal/sample-awal.webp', '22222222-2222-2222-2222-222222222222', now() - interval '2 days')
on conflict (id) do nothing;

-- 11. WO STATUS HISTORY
insert into public.wo_status_history (work_order_id, dari_status, ke_status, catatan, oleh, created_at) values
  ('10000000-0000-0000-0000-000000000001', null, 'menunggu', 'Work order dibuat', '22222222-2222-2222-2222-222222222222', now() - interval '21 days'),
  ('10000000-0000-0000-0000-000000000001', 'menunggu', 'dikerjakan', null, '33333333-3333-3333-3333-333333333333', now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000001', 'dikerjakan', 'selesai', null, '33333333-3333-3333-3333-333333333333', now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000001', 'selesai', 'siap_diambil', 'QC Lulus', '33333333-3333-3333-3333-333333333333', now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000001', 'siap_diambil', 'diambil', 'Mobil diserahkan ke pelanggan', '22222222-2222-2222-2222-222222222222', now() - interval '19 days');
