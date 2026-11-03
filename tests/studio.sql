begin;
insert into auth.users(id,email,raw_app_meta_data) values
('aa880000-0000-4000-8000-000000000001','studio-admin@example.test','{"provider":"google"}'),
('aa880000-0000-4000-8000-000000000002','studio-member@example.test','{"provider":"google"}');
insert into auth.identities(id,user_id,provider,identity_data) values
(gen_random_uuid(),'aa880000-0000-4000-8000-000000000001','google','{}'),
(gen_random_uuid(),'aa880000-0000-4000-8000-000000000002','google','{}');
update public.profiles set is_superadmin=true where id='aa880000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"aa880000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"provider":"google"},"amr":[{"method":"oauth"}]}',true);
do $$declare c uuid;s1 uuid;s2 uuid;r uuid;v integer;d jsonb;begin
 c:=(public.studio_mutate(null,null,'create','{"name":"Acceptance chain","description":"test"}')->>'id')::uuid;
 perform public.studio_mutate(c,0,'add_step','{"name":"Describe","prompt":"Describe {{input}}","use_image":true}');
 perform public.studio_mutate(c,1,'add_step','{"name":"Caption","prompt":"Caption {{previous}}"}');
 select id into s1 from public.studio_steps where chain_id=c and position=1;
 select id into s2 from public.studio_steps where chain_id=c and position=2;
 perform public.studio_mutate(c,2,'reorder',jsonb_build_object('ids',jsonb_build_array(s2,s1)));
 if (select id from public.studio_steps where chain_id=c and position=1)<>s2 then raise exception 'FAIL reorder';end if;
 begin perform public.studio_mutate(c,2,'update','{"name":"Stale"}');raise exception 'FAIL stale edit';exception when serialization_failure then null;end;
 begin perform public.studio_mutate(c,3,'reorder',jsonb_build_object('ids',jsonb_build_array(s1,s1)));raise exception 'FAIL duplicate reorder';exception when invalid_parameter_value then null;end;
 perform public.studio_mutate(c,3,'update_step',jsonb_build_object('id',s2,'name','Caption','prompt','First prompt {{input}}','use_image',false));
 d:=public.studio_begin_run(c,'A sleepy cat',false);r:=(d->>'id')::uuid;
 begin perform public.studio_begin_run(c,'Duplicate',false);raise exception 'FAIL concurrent run';exception when check_violation then null;end;
 perform public.studio_mutate(c,4,'update_step',jsonb_build_object('id',s2,'name','Edited','prompt','New prompt','use_image',false));
 if (select snapshot->'steps'->0->>'prompt' from public.studio_runs where id=r)<>'First prompt {{input}}' then raise exception 'FAIL immutable snapshot';end if;
 perform public.studio_run_progress(r,'[]','failed','Provider unavailable',null);
 perform public.studio_mutate(c,5,'delete_step',jsonb_build_object('id',s1));
 if (select count(*) from public.studio_steps where chain_id=c)<>1 then raise exception 'FAIL delete step';end if;
 perform public.studio_mutate(c,6,'delete','{}');
 if not exists(select 1 from public.studio_runs where id=r) then raise exception 'FAIL history deleted';end if;
 if (select deleted_at from public.studio_chains where id=c) is null then raise exception 'FAIL chain deletion';end if;
 begin perform public.studio_begin_run(c,'Deleted',false);raise exception 'FAIL deleted execution';exception when invalid_parameter_value then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"aa880000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"provider":"google"},"amr":[{"method":"oauth"}]}',true);
do $$begin
 if exists(select 1 from public.studio_chains) or exists(select 1 from public.studio_runs) then raise exception 'FAIL ordinary read';end if;
 begin perform public.studio_mutate(null,null,'create','{"name":"Forbidden"}');raise exception 'FAIL ordinary write';exception when insufficient_privilege then null;end;
 begin insert into storage.objects(bucket_id,name) values('prompt-studio-media','aa880000-0000-4000-8000-000000000002/fake/output.png');raise exception 'FAIL ordinary storage';exception when insufficient_privilege then null;end;
end $$;
set local role anon;
do $$begin
 begin perform public.studio_mutate(null,null,'create','{"name":"Forbidden"}');raise exception 'FAIL anonymous mutation';exception when insufficient_privilege then null;end;
 if exists(select 1 from storage.objects where bucket_id='prompt-studio-media') then raise exception 'FAIL anonymous media';end if;
end $$;
reset role;
rollback;
select 'PASS: CRUD, exact reorder, stale revisions, run snapshot, concurrency, preserved history and role/storage denial' as result;
