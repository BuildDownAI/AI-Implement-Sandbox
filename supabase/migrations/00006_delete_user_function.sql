CREATE OR REPLACE FUNCTION public.delete_current_user()
    returns void
    language plpgsql
    security definer
    set search_path = public, auth
AS $$
BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE execute ON FUNCTION public.delete_current_user FROM public;
GRANT execute ON FUNCTION public.delete_current_user TO authenticated;