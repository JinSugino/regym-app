-- ================================================
-- Phase 2〜3 で追加したRLSポリシーとDB関数
-- ================================================

-- RLSを各テーブルで有効化（Supabaseでは新規テーブルは既定で有効だが、
-- 再現環境のために明示しておく）
alter table profiles enable row level security;
alter table trainers enable row level security;
alter table trainer_schedules enable row level security;
alter table bookings enable row level security;

-- profiles: 本人のみ読み取り可能
create policy "users can read own profile"
on profiles
for select
to authenticated
using (auth.uid() = id);

-- trainers: 認証済みユーザーは読み取り可能
create policy "authenticated users can read trainers"
on trainers
for select
to authenticated
using (true);

-- trainer_schedules: 認証済みユーザーは読み取り可能
create policy "authenticated users can read schedules"
on trainer_schedules
for select
to authenticated
using (true);

-- bookings: 本人の予約は読み取り可能
create policy "users can read own bookings"
on bookings
for select
to authenticated
using (auth.uid() = user_id);

-- 指定トレーナー・指定日の「埋まっている開始時刻」だけを返す関数
-- （個人情報を伏せたまま空き枠算出に使う）
create or replace function get_booked_slots(
  p_trainer_id uuid,
  p_date date
)
returns table (start_time timestamptz)
language sql
security definer
set search_path = public
as $$
  select b.start_time
  from bookings b
  where b.trainer_id = p_trainer_id
    and b.start_time::date = p_date
    and b.status in ('confirmed', 'blocked');
$$;