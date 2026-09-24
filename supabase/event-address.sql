-- 手入力イベントの住所。マップの位置はここから取る。何度 Run しても同じ結果。
alter table public.events add column if not exists address text;
