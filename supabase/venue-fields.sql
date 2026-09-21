-- 会場に @S 施設情報に近い項目と主要SNS（URL）を足す。
-- 何度 Run しても同じ結果。外部サイト・関連リンクは持たない。

alter table public.venues add column if not exists description text;
alter table public.venues add column if not exists phone text;
alter table public.venues add column if not exists hours_text text;
alter table public.venues add column if not exists holiday_text text;
alter table public.venues add column if not exists fee_text text;
alter table public.venues add column if not exists access_transit text;
alter table public.venues add column if not exists access_car text;
alter table public.venues add column if not exists parking_text text;
alter table public.venues add column if not exists payment_text text;
alter table public.venues add column if not exists website_url text;
alter table public.venues add column if not exists sns_instagram text;
alter table public.venues add column if not exists sns_x text;
alter table public.venues add column if not exists sns_line text;
