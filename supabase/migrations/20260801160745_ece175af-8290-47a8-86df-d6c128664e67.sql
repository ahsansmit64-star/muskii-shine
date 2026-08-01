REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.perform_spin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.perform_spin() TO authenticated;