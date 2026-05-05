-- Persistent daily Ask AI usage counter
-- Run in Supabase SQL editor

create table if not exists public.ai_daily_usage (
  day date not null,
  client_key text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, client_key)
);

create or replace function public.increment_ai_daily_usage(
  p_day date,
  p_client_key text,
  p_cap integer
)
returns table(allowed boolean, remaining integer)
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  insert into public.ai_daily_usage(day, client_key, count, updated_at)
  values (p_day, p_client_key, 1, now())
  on conflict (day, client_key)
  do update set count = public.ai_daily_usage.count + 1, updated_at = now()
  returning count into v_count;

  if v_count <= p_cap then
    return query select true, greatest(0, p_cap - v_count);
  else
    return query select false, 0;
  end if;
end;
$$;

grant execute on function public.increment_ai_daily_usage(date, text, integer) to anon, authenticated, service_role;
