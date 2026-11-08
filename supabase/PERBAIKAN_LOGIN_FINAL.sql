-- ====================================================================
-- SOLUSI PERBAIKAN TOTAL: LOGIN & PERMISSION BENGKEL CEMERLANG JAYA
-- File ini menyatukan semua izin (grant), skema, dan 4 akun demo
-- Jalankan file ini SEKALI di SQL Editor Supabase
-- ====================================================================

-- 1. PASTIKAN EXTENSION & SCHEMA PRIVATE DAPAT DIAKSES
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create schema if not exists private;
grant usage on schema private to public, anon, authenticated, service_role;

-- 2. PERBAIKI FUNGSI private.peran_saya() AGAR TIDAK ERROR SAAT DIAKSES
create or replace function private.peran_saya()
returns text
language plpgsql
security definer
set search_path = public, auth
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

-- Berikan izin eksekusi ke authenticated dan anon
grant execute on function private.peran_saya() to public, anon, authenticated, service_role;

-- 3. IZINKAN FUNGSI LAINNYA DI SCHEMA PRIVATE
grant execute on function private.tim_wo(uuid) to authenticated, anon;
grant execute on function private.nomor_berikut(text, text) to authenticated, anon;
grant execute on all functions in schema private to authenticated, anon, service_role;
alter default privileges in schema private grant execute on functions to authenticated, anon, service_role;

-- 4. BUKA AKSES READ PROFILES UNTUK USER LOGIN
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
for select using (
  auth.uid() is not null or id = auth.uid()
);

-- 5. DAFTARKAN ULANG 4 AKUN DEMO RESMI DENGAN KATA SANDI "Bengkel123!"
delete from public.profiles where email in ('owner@cemerlangjaya.test', 'admin@cemerlangjaya.test', 'joko@cemerlangjaya.test', 'slamet@cemerlangjaya.test');
delete from auth.users where email in ('owner@cemerlangjaya.test', 'admin@cemerlangjaya.test', 'joko@cemerlangjaya.test', 'slamet@cemerlangjaya.test');

do $$
declare
  v_enc_pass text;
begin
  v_enc_pass := crypt('Bengkel123!', gen_salt('bf'));

  -- Pak Darto (Owner)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'owner@cemerlangjaya.test', v_enc_pass,
    now(), now(), '{"provider":"email","providers":["email"]}', '{"nama":"Pak Darto","role":"owner"}',
    now(), now()
  );

  insert into public.profiles (id, nama, email, role, aktif)
  values ('11111111-1111-1111-1111-111111111111', 'Pak Darto', 'owner@cemerlangjaya.test', 'owner', true)
  on conflict (id) do update set role = 'owner', aktif = true, nama = 'Pak Darto', email = 'owner@cemerlangjaya.test';

  -- Rina (Admin)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'admin@cemerlangjaya.test', v_enc_pass,
    now(), now(), '{"provider":"email","providers":["email"]}', '{"nama":"Rina","role":"admin"}',
    now(), now()
  );

  insert into public.profiles (id, nama, email, role, aktif)
  values ('22222222-2222-2222-2222-222222222222', 'Rina', 'admin@cemerlangjaya.test', 'admin', true)
  on conflict (id) do update set role = 'admin', aktif = true, nama = 'Rina', email = 'admin@cemerlangjaya.test';

  -- Pak Joko (Kepala Mekanik Tim A)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'joko@cemerlangjaya.test', v_enc_pass,
    now(), now(), '{"provider":"email","providers":["email"]}', '{"nama":"Pak Joko","role":"kepala_mekanik"}',
    now(), now()
  );

  insert into public.profiles (id, nama, email, role, aktif)
  values ('33333333-3333-3333-3333-333333333333', 'Pak Joko', 'joko@cemerlangjaya.test', 'kepala_mekanik', true)
  on conflict (id) do update set role = 'kepala_mekanik', aktif = true, nama = 'Pak Joko', email = 'joko@cemerlangjaya.test';

  -- Pak Slamet (Kepala Mekanik Tim B)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'slamet@cemerlangjaya.test', v_enc_pass,
    now(), now(), '{"provider":"email","providers":["email"]}', '{"nama":"Pak Slamet","role":"kepala_mekanik"}',
    now(), now()
  );

  insert into public.profiles (id, nama, email, role, aktif)
  values ('44444444-4444-4444-4444-444444444444', 'Pak Slamet', 'slamet@cemerlangjaya.test', 'kepala_mekanik', true)
  on conflict (id) do update set role = 'kepala_mekanik', aktif = true, nama = 'Pak Slamet', email = 'slamet@cemerlangjaya.test';
end;
$$;
