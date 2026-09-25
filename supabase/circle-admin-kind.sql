-- 団体の種類に「行政・財団」を足す。最大2つはそのまま。何度 Run しても同じ結果。

alter table public.circles drop constraint if exists circles_kind_check;

alter table public.circles
  add constraint circles_kind_check
  check (
    cardinality(kind) between 1 and 2
    and kind <@ array[
      'サークル',
      '教室・スクール',
      '企業・事務所',
      '行政・財団',
      'その他'
    ]::text[]
  );
