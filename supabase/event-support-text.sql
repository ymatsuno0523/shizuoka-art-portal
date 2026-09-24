-- イベントの共催・後援等。何度 Run しても同じ結果。
alter table public.events add column if not exists support_text text;
