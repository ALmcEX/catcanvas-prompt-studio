begin;
create table public.studio_chains (
 id uuid primary key default gen_random_uuid(), name text not null check(char_length(btrim(name)) between 1 and 120),
 description text not null default '' check(char_length(description)<=2000), version integer not null default 0,
 created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.studio_steps (
 id uuid primary key default gen_random_uuid(), chain_id uuid not null references public.studio_chains(id), position integer not null check(position>0),
 name text not null check(char_length(btrim(name)) between 1 and 120), prompt text not null check(char_length(btrim(prompt)) between 1 and 8000),
 model text not null default 'gemini-3.1-flash-lite' check(model='gemini-3.1-flash-lite'), use_image boolean not null default false,
 unique(chain_id,position) deferrable initially deferred);
create table public.studio_runs (
 id uuid primary key default gen_random_uuid(),chain_id uuid not null references public.studio_chains(id),created_by uuid not null references public.profiles(id),
 snapshot jsonb not null, input text not null check(char_length(input) between 1 and 4000), has_image boolean not null default false,
 results jsonb not null default '[]' check(jsonb_typeof(results)='array' and octet_length(results::text)<=300000),
 status text not null default 'running' check(status in ('running','succeeded','failed')),error text check(char_length(error)<=500),output_path text,
 created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),finished_at timestamptz);
create index studio_runs_chain on public.studio_runs(chain_id,created_at desc);
create index studio_runs_owner on public.studio_runs(created_by,created_at desc);
alter table public.studio_chains enable row level security;
alter table public.studio_steps enable row level security;
alter table public.studio_runs enable row level security;
revoke all on public.studio_chains,public.studio_steps,public.studio_runs from public,anon,authenticated,service_role;
grant select on public.studio_chains,public.studio_steps,public.studio_runs to authenticated;
create policy studio_chains_read on public.studio_chains for select to authenticated using(public.is_superadmin());
create policy studio_steps_read on public.studio_steps for select to authenticated using(public.is_superadmin());
create policy studio_runs_read on public.studio_runs for select to authenticated using(public.is_superadmin());

create function public.studio_validate_steps(p_chain uuid) returns void language plpgsql security definer set search_path='' as $$
declare s record;ref text[];begin
 if (select count(*) from public.studio_steps where chain_id=p_chain)>12 then raise exception 'A chain supports at most 12 steps' using errcode='22023';end if;
 for s in select * from public.studio_steps where chain_id=p_chain loop
  for ref in select regexp_matches(s.prompt,'\{\{step:([a-f0-9-]{36})\}\}','g') loop
   if not exists(select 1 from public.studio_steps where chain_id=p_chain and id=ref[1]::uuid and position<s.position) then
    raise exception 'A prompt references a missing or later step. Update its prompt before deleting or reordering.' using errcode='22023';
   end if;
  end loop;
 end loop;
end $$;
revoke all on function public.studio_validate_steps(uuid) from public,anon,authenticated,service_role;

create function public.studio_mutate(p_chain_id uuid,p_version integer,p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.studio_chains; sid uuid; ids uuid[]; n integer;begin
 perform public.require_superadmin();
 if p_action='create' then
  insert into public.studio_chains(name,description,created_by) values(btrim(p_data->>'name'),coalesce(p_data->>'description',''),auth.uid()) returning * into c;
  return to_jsonb(c);
 end if;
 select * into c from public.studio_chains where id=p_chain_id and deleted_at is null for update;
 if c.id is null then raise exception 'Chain not found' using errcode='22023';end if;
 if p_version is null or p_version<>c.version then raise exception 'This chain changed. Reload and try again.' using errcode='40001';end if;
 case p_action
 when 'update' then update public.studio_chains set name=btrim(p_data->>'name'),description=coalesce(p_data->>'description','') where id=c.id;
 when 'delete' then update public.studio_chains set deleted_at=clock_timestamp() where id=c.id;
 when 'add_step' then
  select count(*)+1 into n from public.studio_steps where chain_id=c.id;
  insert into public.studio_steps(chain_id,position,name,prompt,model,use_image) values(c.id,n,btrim(p_data->>'name'),p_data->>'prompt',coalesce(p_data->>'model','gemini-3.1-flash-lite'),coalesce((p_data->>'use_image')::boolean,false));
 when 'update_step' then
  update public.studio_steps set name=btrim(p_data->>'name'),prompt=p_data->>'prompt',model=coalesce(p_data->>'model','gemini-3.1-flash-lite'),use_image=coalesce((p_data->>'use_image')::boolean,false)
  where chain_id=c.id and id=(p_data->>'id')::uuid;
  if not found then raise exception 'Step not found' using errcode='22023';end if;
 when 'delete_step' then
  delete from public.studio_steps where chain_id=c.id and id=(p_data->>'id')::uuid;
  if not found then raise exception 'Step not found' using errcode='22023';end if;
  with ranked as(select id,row_number() over(order by position) as pos from public.studio_steps where chain_id=c.id)
  update public.studio_steps s set position=r.pos from ranked r where s.id=r.id;
 when 'reorder' then
  select array_agg(value::uuid) into ids from jsonb_array_elements_text(p_data->'ids');
  select count(*) into n from public.studio_steps where chain_id=c.id;
  if ids is null or cardinality(ids)<>n or (select count(distinct x) from unnest(ids) x)<>n or exists(select 1 from unnest(ids) x where not exists(select 1 from public.studio_steps s where s.chain_id=c.id and s.id=x)) then
   raise exception 'Reorder must contain each step exactly once' using errcode='22023';
  end if;
  update public.studio_steps set position=array_position(ids,id) where chain_id=c.id;
 else raise exception 'Unknown operation' using errcode='22023';end case;
 perform public.studio_validate_steps(c.id);
 update public.studio_chains set version=version+1,updated_at=clock_timestamp() where id=c.id returning * into c;
 return to_jsonb(c);
end $$;
revoke all on function public.studio_mutate(uuid,integer,text,jsonb) from public,anon,service_role;
grant execute on function public.studio_mutate(uuid,integer,text,jsonb) to authenticated;

create function public.studio_begin_run(p_chain_id uuid,p_input text,p_has_image boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.studio_chains;s jsonb;r public.studio_runs;begin
 perform public.require_superadmin();
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 update public.studio_runs set status='failed',error='Execution interrupted before completion',finished_at=clock_timestamp(),updated_at=clock_timestamp()
 where created_by=auth.uid() and status='running' and updated_at<clock_timestamp()-interval '5 minutes';
 if exists(select 1 from public.studio_runs where created_by=auth.uid() and status='running') then raise exception 'A chain is already running. Wait for it to finish.' using errcode='23514';end if;
 if (select count(*) from public.studio_runs where created_by=auth.uid() and created_at>clock_timestamp()-interval '1 hour')>=10 then raise exception 'Run limit reached. Try again in an hour.' using errcode='23514';end if;
 select * into c from public.studio_chains where id=p_chain_id and deleted_at is null for update;
 if c.id is null then raise exception 'Chain not found' using errcode='22023';end if;
 perform public.studio_validate_steps(c.id);
 select coalesce(jsonb_agg(to_jsonb(t) order by t.position),'[]'::jsonb) into s from public.studio_steps t where chain_id=c.id;
 if jsonb_array_length(s)=0 then raise exception 'Add at least one step before running.' using errcode='22023';end if;
 insert into public.studio_runs(chain_id,created_by,input,has_image,snapshot) values(c.id,auth.uid(),p_input,p_has_image,jsonb_build_object('chain',to_jsonb(c),'steps',s)) returning * into r;
 return to_jsonb(r);
end $$;
revoke all on function public.studio_begin_run(uuid,text,boolean) from public,anon,service_role;
grant execute on function public.studio_begin_run(uuid,text,boolean) to authenticated;

create function public.studio_run_progress(p_run uuid,p_results jsonb,p_status text default 'running',p_error text default null,p_output_path text default null) returns void
language plpgsql security definer set search_path='' as $$
declare r public.studio_runs;begin
 perform public.require_superadmin();
 select * into r from public.studio_runs where id=p_run and created_by=auth.uid() for update;
 if r.id is null or r.status<>'running' then raise exception 'Run is not active' using errcode='22023';end if;
 if p_status not in ('running','succeeded','failed') or p_results is null or jsonb_typeof(p_results)<>'array' or jsonb_array_length(p_results)<jsonb_array_length(r.results) or jsonb_array_length(p_results)>jsonb_array_length(r.snapshot->'steps') then raise exception 'Invalid run progress' using errcode='22023';end if;
 if p_status='succeeded' and (jsonb_array_length(p_results)<>jsonb_array_length(r.snapshot->'steps') or p_output_path is distinct from auth.uid()::text||'/'||r.id::text||'/output.png') then raise exception 'Missing completed steps or media' using errcode='22023';end if;
 update public.studio_runs set results=p_results,status=p_status,error=left(p_error,500),output_path=p_output_path,updated_at=clock_timestamp(),finished_at=case when p_status='running' then null else clock_timestamp() end where id=r.id;
end $$;
revoke all on function public.studio_run_progress(uuid,jsonb,text,text,text) from public,anon,service_role;
grant execute on function public.studio_run_progress(uuid,jsonb,text,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('prompt-studio-media','prompt-studio-media',false,8388608,array['image/png']);
create policy studio_media_read on storage.objects for select to authenticated using(bucket_id='prompt-studio-media' and public.is_superadmin());
create policy studio_media_write on storage.objects for insert to authenticated with check(bucket_id='prompt-studio-media' and public.is_superadmin() and (storage.foldername(name))[1]=auth.uid()::text);
commit;
