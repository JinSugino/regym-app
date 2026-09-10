-- ================================================
-- Phase 5: オーナーによる予約枠の書き込み権限
-- （ブロック枠作成・代理予約・代理キャンセル用）
-- ================================================

-- オーナーは予約枠を作成できる（ブロック枠・代理予約）
create policy "owners can insert bookings"
on bookings
for insert
to authenticated
with check ( is_owner() );

-- オーナーは予約を更新できる（代理キャンセル）
create policy "owners can update bookings"
on bookings
for update
to authenticated
using ( is_owner() )
with check ( is_owner() );

-- オーナーは予約を削除できる（ブロック解除）
create policy "owners can delete bookings"
on bookings
for delete
to authenticated
using ( is_owner() );