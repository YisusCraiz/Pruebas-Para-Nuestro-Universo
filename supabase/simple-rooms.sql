create schema if not exists animejj_private;
revoke all on schema animejj_private from public,anon;
grant usage on schema animejj_private to authenticated;
alter table public.animejj_rooms add column join_code text unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)), add column guest_id uuid references auth.users(id) on delete set null, add column owner_name text not null default 'Anfitrión', add column guest_name text, add column owner_seen timestamptz, add column guest_seen timestamptz;
alter table public.animejj_rooms alter column guest_email set default 'pending@users.animejj.invalid';
alter table public.animejj_rooms drop constraint animejj_rooms_media_url_check;
alter table public.animejj_rooms add constraint animejj_rooms_media_url_check check (media_url='' or (media_url ~ '^https://' and length(media_url)<=8192));
alter table public.animejj_rooms alter column media_url set default '';
drop policy "members read rooms" on public.animejj_rooms;
create policy "members read rooms" on public.animejj_rooms for select to authenticated using ((select auth.uid())=owner_id or (select auth.uid())=guest_id or lower((select auth.jwt())->>'email')=guest_email);
revoke insert on public.animejj_rooms from authenticated;
create table animejj_private.join_attempts(user_id uuid primary key, bucket timestamptz not null, attempts integer not null);
revoke all on animejj_private.join_attempts from public,anon,authenticated;
create function animejj_private.room_action(action text, code text default null, rid uuid default null) returns public.animejj_rooms language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); r public.animejj_rooms; uname text; n integer;
begin
 if uid is null then raise exception 'Inicia sesión para usar las salas.'; end if;
 uname := split_part(auth.jwt()->>'email','@',1);
 if action='create' then
  if (select count(*) from public.animejj_rooms where owner_id=uid and created_at>now()-interval '1 hour')>=10 then raise exception 'Ya creaste varias salas. Intenta más tarde.'; end if;
  insert into public.animejj_rooms(owner_id,owner_name,owner_seen) values(uid,uname,now()) returning * into r;
 elsif action='join' then
  insert into animejj_private.join_attempts values(uid,date_trunc('minute',now()),1)
  on conflict(user_id) do update set bucket=excluded.bucket,attempts=case when animejj_private.join_attempts.bucket=excluded.bucket then animejj_private.join_attempts.attempts+1 else 1 end returning attempts into n;
  if n>10 then return null; end if;
  select * into r from public.animejj_rooms where join_code=upper(replace(trim(code),'-','')) for update;
  if r.id is null then return null; end if;
  if r.owner_id<>uid then
   if r.guest_id is not null and r.guest_id<>uid then return null; end if;
   update public.animejj_rooms set guest_id=uid,guest_name=uname,guest_seen=now() where id=r.id returning * into r;
  else
   update public.animejj_rooms set owner_seen=now() where id=r.id returning * into r;
  end if;
 elsif action in ('heartbeat','leave') then
  select * into r from public.animejj_rooms where id=rid and (owner_id=uid or guest_id=uid) for update;
  if r.id is null then return null; end if;
  if r.owner_id=uid then update public.animejj_rooms set owner_seen=case when action='leave' then null else now() end where id=rid returning * into r;
  else update public.animejj_rooms set guest_seen=case when action='leave' then null else now() end where id=rid returning * into r; end if;
 else raise exception 'Acción inválida'; end if;
 return r;
end; $$;
revoke all on function animejj_private.room_action(text,text,uuid) from public,anon;
grant execute on function animejj_private.room_action(text,text,uuid) to authenticated;
create function public.animejj_room_action(action text, code text default null, rid uuid default null) returns public.animejj_rooms language sql security invoker set search_path='' as $$ select animejj_private.room_action(action,code,rid); $$;
revoke all on function public.animejj_room_action(text,text,uuid) from public,anon;
grant execute on function public.animejj_room_action(text,text,uuid) to authenticated;
-- Presence updates must not move the playback time anchor.
create or replace function public.animejj_stamp_room() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.position is distinct from old.position or new.playing is distinct from old.playing or new.media_url is distinct from old.media_url then new.updated_at=clock_timestamp(); end if;
 return new;
end; $$;