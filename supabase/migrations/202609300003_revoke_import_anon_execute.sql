-- Supabase's function default ACL explicitly granted anon execution despite revoking PUBLIC.
revoke execute on function public.create_import_job(uuid,text,integer,jsonb) from anon;
revoke execute on function public.import_existing_asset_codes(uuid,text[]) from anon;
