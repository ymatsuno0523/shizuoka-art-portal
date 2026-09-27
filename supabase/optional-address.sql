-- 住所は任意。NOT NULL になっていれば外す。
alter table public.venues alter column address drop not null;
alter table public.events alter column address drop not null;
alter table public.circles alter column address drop not null;
