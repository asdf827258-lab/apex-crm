set search_path = public;

drop policy if exists ai_dept_reports_select on public.ai_dept_reports;
create policy ai_dept_reports_select on public.ai_dept_reports
  for select to authenticated using (true);

drop policy if exists ai_dept_reports_write on public.ai_dept_reports;
drop policy if exists ai_dept_reports_insert on public.ai_dept_reports;
create policy ai_dept_reports_insert on public.ai_dept_reports
  for insert to authenticated with check (public.is_admin() or public.is_owner());
drop policy if exists ai_dept_reports_update on public.ai_dept_reports;
create policy ai_dept_reports_update on public.ai_dept_reports
  for update to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());
drop policy if exists ai_dept_reports_delete on public.ai_dept_reports;
create policy ai_dept_reports_delete on public.ai_dept_reports
  for delete to authenticated using (public.is_admin() or public.is_owner());

drop policy if exists ai_ideas_select on public.ai_ideas;
create policy ai_ideas_select on public.ai_ideas
  for select to authenticated using (true);

drop policy if exists ai_ideas_write on public.ai_ideas;
drop policy if exists ai_ideas_insert on public.ai_ideas;
create policy ai_ideas_insert on public.ai_ideas
  for insert to authenticated with check (public.is_admin() or public.is_owner());
drop policy if exists ai_ideas_update on public.ai_ideas;
create policy ai_ideas_update on public.ai_ideas
  for update to authenticated
  using (public.is_admin() or public.is_owner())
  with check (public.is_admin() or public.is_owner());
drop policy if exists ai_ideas_delete on public.ai_ideas;
create policy ai_ideas_delete on public.ai_ideas
  for delete to authenticated using (public.is_admin() or public.is_owner());

grant select on public.ai_dept_reports, public.ai_ideas to authenticated;
grant insert, update, delete on public.ai_dept_reports, public.ai_ideas to authenticated;

notify pgrst, 'reload schema';
