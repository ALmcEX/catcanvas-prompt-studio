begin;
-- A terminal status update must not depend on resending a failed progress payload.
create function public.studio_fail_run(p_run uuid,p_error text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform public.require_superadmin();
 update public.studio_runs set status='failed',error=left(coalesce(p_error,'Execution failed'),500),updated_at=clock_timestamp(),finished_at=clock_timestamp()
 where id=p_run and created_by=auth.uid() and status='running';
end $$;
revoke all on function public.studio_fail_run(uuid,text) from public,anon,service_role;
grant execute on function public.studio_fail_run(uuid,text) to authenticated;
commit;
