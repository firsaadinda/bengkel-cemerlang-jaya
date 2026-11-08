-- ====================================================================
-- SOLUSI PERBAIKAN LOGIN LENGKAP & AMAN (TANPA MENGHAPUS DATA APAPUN)
-- Aman dari Foreign Key Constraint Violation (work_orders, billing, dll.)
-- ====================================================================

-- 1. PASTIKAN EXTENSION & SCHEMA PRIVATE DAPAT DIAKSES
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create schema if not exists private;
grant usage on schema private to public, anon, authenticated, service_role;

-- 2. PERBAIKI FUNGSI private.peran_saya() AGAR AMAN DAN TIDAK ERROR
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

grant execute on function private.peran_saya() to public, anon, authenticated, service_role;
grant execute on function private.tim_wo(uuid) to public, anon, authenticated, service_role;
grant execute on function private.nomor_berikut(text, text) to public, anon, authenticated, service_role;
grant execute on all functions in schema private to public, anon, authenticated, service_role;
alter default privileges in schema private grant execute on functions to public, anon, authenticated, service_role;

-- 3. BUKA AKSES READ PROFILES AGAR CLIENT DAPAT MEMBACA PROFIL
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
for select using (true);

-- 4. PERBAIKI STRUKTUR auth.users UNTUK MENGATASI "Database error querying schema"
-- GoTrue Go driver mengalami panic jika kolom token bernilai NULL (harus string kosong '')
update auth.users
set 
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  reauthentication_token = coalesce(reauthentication_token, ''),
  is_super_admin = coalesce(is_super_admin, false),
  is_sso_user = coalesce(is_sso_user, false),
  is_anonymous = coalesce(is_anonymous, false),
  email_change_confirm_status = coalesce(email_change_confirm_status, 0),
  encrypted_password = crypt('Bengkel123!', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  last_sign_in_at = coalesce(last_sign_in_at, now())
where email in (
  'owner@cemerlangjaya.test',
  'admin@cemerlangjaya.test',
  'joko@cemerlangjaya.test',
  'slamet@cemerlangjaya.test'
);

-- 5. PASTIKAN SELURUH PROFIL BERSTATUS AKTIF DAN ROLE SESUAI CHECK CONSTRAINT
update public.profiles
set aktif = true
where email in (
  'owner@cemerlangjaya.test',
  'admin@cemerlangjaya.test',
  'joko@cemerlangjaya.test',
  'slamet@cemerlangjaya.test'
);
