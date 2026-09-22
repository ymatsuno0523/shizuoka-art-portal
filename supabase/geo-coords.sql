-- 住所から求めたピン位置。未実行でもマップは住所をその場で変換する。
alter table public.venues add column if not exists lat double precision;
alter table public.venues add column if not exists lng double precision;
alter table public.events add column if not exists lat double precision;
alter table public.events add column if not exists lng double precision;
