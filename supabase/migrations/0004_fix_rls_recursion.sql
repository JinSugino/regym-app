-- ================================================
-- Phase 5: RLS無限再帰の解消とオーナー権限判定関数の追加
-- ================================================

-- 1. 無限再帰を引き起こしていた既存ポリシーの削除
drop policy if exists "owners can read all profiles" on profiles;
drop policy if exists "owners can read all bookings" on bookings;
drop policy if exists "owners can manage schedules" on trainer_schedules;

-- 2. RLSを迂回して安全にオーナー判定を行うヘルパー関数（security definer）
create or replace function is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- 3. is_owner() を使用したポリシーの再定義

-- profiles: オーナーは全プロフィールを読み取り可能
create policy "owners can read all profiles"
on profiles
for select
to authenticated
using ( is_owner() );

-- bookings: オーナーは全予約を読み取り可能
create policy "owners can read all bookings"
on bookings
for select
to authenticated
using ( is_owner() );

-- trainer_schedules: オーナーは全シフトの参照・編集・削除が可能
create policy "owners can manage schedules"
on trainer_schedules
for all
to authenticated
using ( is_owner() )
with check ( is_owner() );