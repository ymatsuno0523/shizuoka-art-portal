-- イベントの会期中休み・料金補足。何度 Run しても同じ結果。

alter table public.events add column if not exists holiday_text text;
alter table public.events add column if not exists fee_note text;
