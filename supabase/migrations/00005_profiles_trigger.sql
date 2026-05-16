CREATE OR REPLACE FUNCTION public.handle_new_user()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id) VALUES (new.id);
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();