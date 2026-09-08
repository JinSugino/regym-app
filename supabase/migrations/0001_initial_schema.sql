-- ================================================
-- 杉野パーソナルジム 予約システム
-- 初期スキーマ (DB設計書 v1.1)
-- ================================================

-- ① profiles（ユーザー情報：auth.usersと1対1）
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('member', 'owner')),
  created_at timestamptz not null default now()
);

-- ② trainers（トレーナーマスタ：ログインしない）
create table trainers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ③ trainer_schedules（曜日ごとの基本シフト）
create table trainer_schedules (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references trainers(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null
);

-- ④ bookings（予約：心臓部）
create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  trainer_id uuid not null references trainers(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'blocked')),
  created_at timestamptz not null default now()
);

-- 二重予約・ブロック枠の排他制御（キャンセル済みは除外）
create unique index unique_active_booking
on bookings (trainer_id, start_time)
where status in ('confirmed', 'blocked');