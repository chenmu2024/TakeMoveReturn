-- Status changes must revoke sessions and increment auth_version atomically.
-- Until that workflow exists, do not permit direct status changes or deletion.
revoke update (status) on public.workers from authenticated;
revoke delete on public.workers from public, anon, authenticated;
