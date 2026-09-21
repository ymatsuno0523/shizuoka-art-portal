-- 使わない SNS 列を施設・団体から外す。
-- 何度 Run しても同じ結果。残すのは Instagram / X / LINE。

alter table public.venues drop column if exists sns_facebook;
alter table public.venues drop column if exists sns_youtube;
alter table public.venues drop column if exists sns_tiktok;

alter table public.circles drop column if exists sns_facebook;
alter table public.circles drop column if exists sns_youtube;
alter table public.circles drop column if exists sns_tiktok;
