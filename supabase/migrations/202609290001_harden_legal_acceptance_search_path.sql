-- Harden the signup legal-acceptance trigger against search_path object shadowing.
-- The function body already uses fully-qualified public.legal_acceptances and auth.users trigger context.
alter function public.record_signup_legal_acceptance() set search_path = '';
