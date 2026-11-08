-- ====================================================================
-- FUNGSI DASHBOARD DAN LAPORAN (HEMAT EGRESS)
-- Sesuai PRD App 4 - Bootcamp AI Web Programming Sesi 9
-- ====================================================================

-- 1. dashboard_ringkasan
create or replace function public.dashboard_ringkasan(
  p_dari timestamptz default (date_trunc('month', now())),
  p_sampai timestamptz default (now())
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_user_id uuid;
  v_result jsonb := '{}'::jsonb;

  -- Variabel Owner
  v_pendapatan bigint := 0;
  v_modal bigint := 0;
  v_laba bigint := 0;
  v_margin numeric := 0;
  v_wo_aktif int := 0;
  v_wo_terlambat int := 0;
  v_piutang bigint := 0;

  -- Variabel Admin
  v_masuk_hari_ini int := 0;
  v_siap_diambil int := 0;
  v_perlu_ditagih int := 0;
  v_pendapatan_hari_ini bigint := 0;
  v_stok_menipis int := 0;

  -- Variabel Kepala Mekanik
  v_menunggu int := 0;
  v_dikerjakan int := 0;
  v_menunggu_qc int := 0;
  v_terlambat_tim int := 0;
begin
  v_user_id := auth.uid();
  v_role := private.peran_saya();

  if v_role is null then
    raise exception 'Tidak memiliki akses atau akun nonaktif';
  end if;

  if v_role = 'owner' then
    -- Pendapatan dalam periode
    select coalesce(sum(total), 0) into v_pendapatan
    from public.invoices
    where diterbitkan_at >= p_dari and diterbitkan_at <= p_sampai;

    -- Modal spare part dari invoice dalam periode
    select coalesce(sum(c.harga_modal * b.jumlah), 0) into v_modal
    from public.invoices inv
    join public.billing_items b on b.work_order_id = inv.work_order_id
    join public.billing_item_costs c on c.billing_item_id = b.id
    where inv.diterbitkan_at >= p_dari and inv.diterbitkan_at <= p_sampai
      and b.jenis = 'part';

    v_laba := v_pendapatan - v_modal;
    if v_pendapatan > 0 then
      v_margin := round((v_laba::numeric / v_pendapatan::numeric) * 100, 1);
    else
      v_margin := 0;
    end if;

    -- WO Aktif & Terlambat
    select count(*) into v_wo_aktif
    from public.work_orders
    where status in ('menunggu', 'dikerjakan', 'tertunda');

    select count(*) into v_wo_terlambat
    from public.work_orders
    where status in ('menunggu', 'dikerjakan', 'tertunda')
      and estimasi_selesai < current_date;

    -- Piutang
    select coalesce(sum(total - terbayar), 0) into v_piutang
    from public.invoices
    where status_bayar in ('belum_bayar', 'sebagian');

    v_result := jsonb_build_object(
      'peran', 'owner',
      'pendapatan', v_pendapatan,
      'modal', v_modal,
      'laba_kotor', v_laba,
      'margin_persen', v_margin,
      'wo_aktif', v_wo_aktif,
      'wo_terlambat', v_wo_terlambat,
      'piutang', v_piutang
    );

  elsif v_role = 'admin' then
    select count(*) into v_masuk_hari_ini
    from public.work_orders
    where date(created_at) = current_date;

    select count(*) into v_siap_diambil
    from public.work_orders
    where status = 'siap_diambil';

    select count(*) into v_perlu_ditagih
    from public.work_orders w
    left join public.invoices i on i.work_order_id = w.id
    where w.status = 'siap_diambil' and (i.id is null or i.status_bayar != 'lunas');

    select coalesce(sum(jumlah), 0) into v_pendapatan_hari_ini
    from public.payments
    where date(created_at) = current_date;

    select count(*) into v_stok_menipis
    from public.inventory_items
    where jenis = 'part' and aktif = true and stok <= stok_minimum;

    select count(*) into v_wo_aktif
    from public.work_orders
    where status in ('menunggu', 'dikerjakan', 'tertunda');

    v_result := jsonb_build_object(
      'peran', 'admin',
      'mobil_masuk_hari_ini', v_masuk_hari_ini,
      'siap_diambil', v_siap_diambil,
      'perlu_ditagih', v_perlu_ditagih,
      'pendapatan_hari_ini', v_pendapatan_hari_ini,
      'stok_menipis', v_stok_menipis,
      'wo_aktif', v_wo_aktif
    );

  elsif v_role = 'kepala_mekanik' then
    select count(*) into v_menunggu
    from public.work_orders
    where kepala_mekanik_id = v_user_id and status = 'menunggu';

    select count(*) into v_dikerjakan
    from public.work_orders
    where kepala_mekanik_id = v_user_id and status in ('dikerjakan', 'tertunda');

    select count(*) into v_menunggu_qc
    from public.work_orders
    where kepala_mekanik_id = v_user_id and status = 'selesai';

    select count(*) into v_terlambat_tim
    from public.work_orders
    where kepala_mekanik_id = v_user_id
      and status in ('menunggu', 'dikerjakan', 'tertunda')
      and estimasi_selesai < current_date;

    v_result := jsonb_build_object(
      'peran', 'kepala_mekanik',
      'menunggu_ditugaskan', v_menunggu,
      'sedang_dikerjakan', v_dikerjakan,
      'menunggu_qc', v_menunggu_qc,
      'terlambat', v_terlambat_tim
    );
  end if;

  return v_result;
end;
$$;
revoke execute on function public.dashboard_ringkasan from public, anon;
grant execute on function public.dashboard_ringkasan to authenticated;

-- 2. dashboard_pendapatan_harian
create or replace function public.dashboard_pendapatan_harian(
  p_dari timestamptz default (date_trunc('month', now())),
  p_sampai timestamptz default (now())
)
returns table (
  tanggal date,
  pendapatan_jasa bigint,
  pendapatan_part bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  v_role := private.peran_saya();
  if v_role not in ('owner', 'admin') then
    raise exception 'Hanya Owner atau Admin yang boleh melihat grafik pendapatan';
  end if;

  return query
  select
    date(inv.diterbitkan_at) as tanggal,
    coalesce(sum(case when b.jenis = 'jasa' then b.jumlah * b.harga_dipakai else 0 end), 0)::bigint as pendapatan_jasa,
    coalesce(sum(case when b.jenis = 'part' then b.jumlah * b.harga_dipakai else 0 end), 0)::bigint as pendapatan_part
  from public.invoices inv
  join public.billing_items b on b.work_order_id = inv.work_order_id
  where inv.diterbitkan_at >= p_dari and inv.diterbitkan_at <= p_sampai
  group by date(inv.diterbitkan_at)
  order by date(inv.diterbitkan_at) asc;
end;
$$;
revoke execute on function public.dashboard_pendapatan_harian from public, anon;
grant execute on function public.dashboard_pendapatan_harian to authenticated;

-- 3. dashboard_wo_per_status
create or replace function public.dashboard_wo_per_status(
  p_tim uuid default null
)
returns table (
  status text,
  jumlah bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_filter_tim uuid;
begin
  v_role := private.peran_saya();
  if v_role is null then
    raise exception 'Akses ditolak';
  end if;

  if v_role = 'kepala_mekanik' then
    v_filter_tim := auth.uid();
  else
    v_filter_tim := p_tim;
  end if;

  return query
  with all_statuses as (
    select unnest(array['menunggu', 'dikerjakan', 'tertunda', 'selesai', 'siap_diambil', 'diambil', 'dibatalkan']) as st
  )
  select
    a.st as status,
    count(w.id)::bigint as jumlah
  from all_statuses a
  left join public.work_orders w on w.status = a.st
    and (v_filter_tim is null or w.kepala_mekanik_id = v_filter_tim)
  group by a.st
  order by array_position(array['menunggu', 'dikerjakan', 'tertunda', 'selesai', 'siap_diambil', 'diambil', 'dibatalkan'], a.st);
end;
$$;
revoke execute on function public.dashboard_wo_per_status from public, anon;
grant execute on function public.dashboard_wo_per_status to authenticated;

-- 4. dashboard_beban_mekanik
create or replace function public.dashboard_beban_mekanik(
  p_dari timestamptz default (date_trunc('month', now())),
  p_sampai timestamptz default (now()),
  p_tim uuid default null
)
returns table (
  mekanik_id uuid,
  mekanik text,
  tim text,
  wo_aktif bigint,
  wo_selesai bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_filter_tim uuid;
begin
  v_role := private.peran_saya();
  if v_role not in ('owner', 'kepala_mekanik') then
    raise exception 'Akses ditolak';
  end if;

  if v_role = 'kepala_mekanik' then
    v_filter_tim := auth.uid();
  else
    v_filter_tim := p_tim;
  end if;

  return query
  select
    m.id as mekanik_id,
    m.nama as mekanik,
    p.nama as tim,
    count(distinct case when w.status in ('dikerjakan', 'tertunda') then w.id end)::bigint as wo_aktif,
    count(distinct case when w.status in ('selesai', 'siap_diambil', 'diambil')
      and w.selesai_at >= p_dari and w.selesai_at <= p_sampai then w.id end)::bigint as wo_selesai
  from public.mekanik m
  join public.profiles p on p.id = m.kepala_mekanik_id
  left join public.work_order_mekanik wm on wm.mekanik_id = m.id
  left join public.work_orders w on w.id = wm.work_order_id
  where m.aktif = true
    and (v_filter_tim is null or m.kepala_mekanik_id = v_filter_tim)
  group by m.id, m.nama, p.nama
  order by wo_aktif asc, m.nama asc;
end;
$$;
revoke execute on function public.dashboard_beban_mekanik from public, anon;
grant execute on function public.dashboard_beban_mekanik to authenticated;

-- 5. dashboard_wo_selesai_harian
create or replace function public.dashboard_wo_selesai_harian(
  p_dari timestamptz default (now() - interval '14 days'),
  p_sampai timestamptz default (now())
)
returns table (
  tanggal date,
  jumlah bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_filter_tim uuid := null;
begin
  v_role := private.peran_saya();
  if v_role is null then
    raise exception 'Akses ditolak';
  end if;

  if v_role = 'kepala_mekanik' then
    v_filter_tim := auth.uid();
  end if;

  return query
  select
    date(w.selesai_at) as tanggal,
    count(w.id)::bigint as jumlah
  from public.work_orders w
  where w.selesai_at >= p_dari and w.selesai_at <= p_sampai
    and (v_filter_tim is null or w.kepala_mekanik_id = v_filter_tim)
  group by date(w.selesai_at)
  order by date(w.selesai_at) asc;
end;
$$;
revoke execute on function public.dashboard_wo_selesai_harian from public, anon;
grant execute on function public.dashboard_wo_selesai_harian to authenticated;

-- 6. dashboard_top_item
create or replace function public.dashboard_top_item(
  p_dari timestamptz default (date_trunc('month', now())),
  p_sampai timestamptz default (now()),
  p_jenis text default 'part'
)
returns table (
  nama text,
  jumlah bigint,
  pendapatan bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  v_role := private.peran_saya();
  if v_role not in ('owner', 'admin') then
    raise exception 'Akses ditolak';
  end if;

  return query
  select
    b.nama_item as nama,
    sum(b.jumlah)::bigint as jumlah,
    sum(b.jumlah * b.harga_dipakai)::bigint as pendapatan
  from public.invoices inv
  join public.billing_items b on b.work_order_id = inv.work_order_id
  where inv.diterbitkan_at >= p_dari and inv.diterbitkan_at <= p_sampai
    and b.jenis = p_jenis
  group by b.nama_item
  order by pendapatan desc, jumlah desc
  limit 5;
end;
$$;
revoke execute on function public.dashboard_top_item from public, anon;
grant execute on function public.dashboard_top_item to authenticated;

-- 7. dashboard_laba_harian (Hanya Owner)
create or replace function public.dashboard_laba_harian(
  p_dari timestamptz default (date_trunc('month', now())),
  p_sampai timestamptz default (now())
)
returns table (
  tanggal date,
  pendapatan bigint,
  modal bigint,
  laba bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  v_role := private.peran_saya();
  if v_role != 'owner' then
    raise exception 'Hanya Owner yang boleh melihat dashboard laba';
  end if;

  return query
  select
    date(inv.diterbitkan_at) as tanggal,
    coalesce(sum(b.jumlah * b.harga_dipakai), 0)::bigint as pendapatan,
    coalesce(sum(case when b.jenis = 'part' then c.harga_modal * b.jumlah else 0 end), 0)::bigint as modal,
    (coalesce(sum(b.jumlah * b.harga_dipakai), 0) - coalesce(sum(case when b.jenis = 'part' then c.harga_modal * b.jumlah else 0 end), 0))::bigint as laba
  from public.invoices inv
  join public.billing_items b on b.work_order_id = inv.work_order_id
  join public.billing_item_costs c on c.billing_item_id = b.id
  where inv.diterbitkan_at >= p_dari and inv.diterbitkan_at <= p_sampai
  group by date(inv.diterbitkan_at)
  order by date(inv.diterbitkan_at) asc;
end;
$$;
revoke execute on function public.dashboard_laba_harian from public, anon;
grant execute on function public.dashboard_laba_harian to authenticated;

-- 8. laporan_laba (Hanya Owner)
create or replace function public.laporan_laba(
  p_dari timestamptz default (date_trunc('month', now())),
  p_sampai timestamptz default (now())
)
returns table (
  nomor_wo text,
  nomor_invoice text,
  tanggal_invoice timestamptz,
  plat text,
  pendapatan bigint,
  modal bigint,
  laba bigint,
  margin_persen numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  v_role := private.peran_saya();
  if v_role != 'owner' then
    raise exception 'Hanya Owner yang boleh mengakses Laporan Laba';
  end if;

  return query
  select
    w.nomor as nomor_wo,
    inv.nomor as nomor_invoice,
    inv.diterbitkan_at as tanggal_invoice,
    v.plat,
    inv.total as pendapatan,
    coalesce(sum(case when b.jenis = 'part' then c.harga_modal * b.jumlah else 0 end), 0)::bigint as modal,
    (inv.total - coalesce(sum(case when b.jenis = 'part' then c.harga_modal * b.jumlah else 0 end), 0))::bigint as laba,
    case
      when inv.total > 0 then
        round(((inv.total - coalesce(sum(case when b.jenis = 'part' then c.harga_modal * b.jumlah else 0 end), 0))::numeric / inv.total::numeric) * 100, 1)
      else 0
    end as margin_persen
  from public.invoices inv
  join public.work_orders w on w.id = inv.work_order_id
  join public.vehicles v on v.id = w.vehicle_id
  left join public.billing_items b on b.work_order_id = w.id
  left join public.billing_item_costs c on c.billing_item_id = b.id
  where inv.diterbitkan_at >= p_dari and inv.diterbitkan_at <= p_sampai
  group by w.nomor, inv.nomor, inv.diterbitkan_at, v.plat, inv.total
  order by inv.diterbitkan_at desc;
end;
$$;
revoke execute on function public.laporan_laba from public, anon;
grant execute on function public.laporan_laba to authenticated;
