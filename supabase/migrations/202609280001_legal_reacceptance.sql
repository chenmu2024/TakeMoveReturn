create policy "users insert own legal acceptance" on public.legal_acceptances
  for insert to authenticated with check (user_id = auth.uid());

create policy "users update own legal acceptance" on public.legal_acceptances
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant insert, update on public.legal_acceptances to authenticated;
