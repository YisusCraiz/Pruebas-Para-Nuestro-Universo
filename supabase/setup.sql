-- Ejecutar SOLO en el proyecto de pruebas suvcdkqqwrodwxgmcjej.
-- No modifica tablas de Nuestro Universo. No borra datos existentes.
begin;
create table if not exists public.animejj_rooms (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 guest_email text not null check (guest_email = lower(guest_email) and length(guest_email) between 3 and 254),
 media_url text not null check (media_url ~ '^https://' and length(media_url) <= 8192),
 position double precision not null default 0 check (position >= 0 and position < 864000),
 playing boolean not null default false,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.animejj_rooms enable row level security;
revoke all on public.animejj_rooms from anon, authenticated;
grant select, insert, delete on public.animejj_rooms to authenticated;
grant update (media_url, position, playing) on public.animejj_rooms to authenticated;
drop policy if exists "members read rooms" on public.animejj_rooms;
create policy "members read rooms" on public.animejj_rooms for select to authenticated using (
 (select auth.uid()) = owner_id or (
  lower((select auth.jwt())->>'email') = guest_email
  and coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false) = false
 )
);
drop policy if exists "owner creates rooms" on public.animejj_rooms;
create policy "owner creates rooms" on public.animejj_rooms for insert to authenticated with check (
 (select auth.uid()) = owner_id and (select auth.jwt())->>'email' is not null
 and coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false) = false
);
drop policy if exists "owner controls rooms" on public.animejj_rooms;
create policy "owner controls rooms" on public.animejj_rooms for update to authenticated
 using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "owner deletes rooms" on public.animejj_rooms;
create policy "owner deletes rooms" on public.animejj_rooms for delete to authenticated using ((select auth.uid()) = owner_id);
create or replace function public.animejj_stamp_room() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end;
$$;
revoke all on function public.animejj_stamp_room() from public, anon, authenticated;
drop trigger if exists animejj_stamp_room on public.animejj_rooms;
create trigger animejj_stamp_room before update on public.animejj_rooms for each row execute function public.animejj_stamp_room();
create index if not exists animejj_rooms_owner_idx on public.animejj_rooms(owner_id);
create index if not exists animejj_rooms_guest_idx on public.animejj_rooms(guest_email);
commit;
-- Verificación de configuración (sin exponer datos):
select relname, relrowsecurity from pg_class where oid='public.animejj_rooms'::regclass;
select policyname, cmd from pg_policies where schemaname='public' and tablename='animejj_rooms';
