-- Ya aplicado al proyecto de pruebas; conservar como referencia.
create table if not exists public.animejj_signup_limits (bucket timestamptz primary key, attempts integer not null);
alter table public.animejj_signup_limits enable row level security;
revoke all on public.animejj_signup_limits from public,anon,authenticated;
grant all on public.animejj_signup_limits to service_role;
create or replace function public.animejj_allow_signup() returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 delete from public.animejj_signup_limits where bucket < now()-interval '2 hours';
 insert into public.animejj_signup_limits(bucket,attempts) values(date_trunc('hour',now()),1)
 on conflict(bucket) do update set attempts=public.animejj_signup_limits.attempts+1 returning attempts into n;
 return n<=20;
end; $$;
revoke all on function public.animejj_allow_signup() from public,anon,authenticated;
grant execute on function public.animejj_allow_signup() to service_role;
drop policy if exists "server manages signup counters" on public.animejj_signup_limits;
create policy "server manages signup counters" on public.animejj_signup_limits for all to service_role using (true) with check (true);
