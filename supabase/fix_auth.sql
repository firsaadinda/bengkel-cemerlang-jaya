-- ====================================================================
-- FIX AKUN LOGIN & PERMISSION DATABASE SUPABASE
-- Jalankan skrip ini langsung di menu: Supabase Dashboard > SQL Editor > New query
-- ====================================================================

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

-- 2. Bersihkan dan perbaiki data akun auth.users agar GoTrue Auth bisa membaca schema
delete from public.profiles where email in ('owner@cemerlangjaya.test', 'admin@cemerlangjaya.test', 'joko@cemerlangjaya.test', 'slamet@cemerlangjaya.test');
delete from auth.users where email in ('owner@cemerlangjaya.test', 'admin@cemerlangjaya.test', 'joko@cemerlangjaya.test', 'slamet@cemerlangjaya.test');

-- 3. Masukkan ulang 4 akun dengan struktur lengkap auth.users Supabase (Password: Bengkel123!)
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
    '{"provider":"email","providers":["email"]}', '{"nama":"Pak Joko (Tim A)","role":"kepala_mekanik"}',
    false, now(), now(), null, null, '', '', null, '', 0, null, '', null, false, null, false
  );

  insert into public.profiles (id, nama, email, role, aktif)
  values ('33333333-3333-3333-3333-333333333333', 'Pak Joko', 'joko@cemerlangjaya.test', 'kepala_mekanik', true)
  on conflict (id) do update set role = 'kepala_mekanik', aktif = true, nama = 'Pak Joko', email = 'joko@cemerlangjaya.test';

  -- Pak Slamet (Kepala Mekanik Tim B)
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
    '{"provider":"email","providers":["email"]}', '{"nama":"Pak Slamet (Tim B)","role":"kepala_mekanik"}',
    false, now(), now(), null, null, '', '', null, '', 0, null, '', null, false, null, false
  );

  insert into public.profiles (id, nama, email, role, aktif)
  values ('44444444-4444-4444-4444-444444444444', 'Pak Slamet', 'slamet@cemerlangjaya.test', 'kepala_mekanik', true)
  on conflict (id) do update set role = 'kepala_mekanik', aktif = true, nama = 'Pak Slamet', email = 'slamet@cemerlangjaya.test';
end;
$$;

