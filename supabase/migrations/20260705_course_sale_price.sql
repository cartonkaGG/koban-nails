-- Promotional sale price for courses (optional, must be less than price_uah)

alter table public.courses
  add column if not exists sale_price_uah integer;

comment on column public.courses.sale_price_uah is 'Optional promotional price in UAH; shown when lower than price_uah';
