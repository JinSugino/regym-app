-- ================================================
-- Phase 4 で追加した bookings の書き込みポリシー
-- ================================================

-- 本人は自分の予約を作成できる
create policy "users can create own bookings"
on bookings
for insert
to authenticated
with check (auth.uid() = user_id);

-- 本人は自分の予約を更新できる（キャンセル用）
create policy "users can update own bookings"
on bookings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);