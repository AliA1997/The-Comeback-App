-- The auth.users -> user_profiles trigger.
--
-- Kept apart from policies.sql because it touches Supabase's `auth` schema,
-- which a project's Postgres role may not own. `pnpm seed` applies this one
-- separately and only warns if it fails: the API upserts the profile on the
-- first authenticated request, so a missing trigger never blocks sign-in
-- (spec § 5.2).

CREATE OR REPLACE FUNCTION comebackapp.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = comebackapp, pg_temp
AS $$
BEGIN
  INSERT INTO comebackapp.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION comebackapp.handle_new_auth_user();
