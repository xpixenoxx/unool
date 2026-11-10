-- BUG-009 / FIX-12: indexed email → auth user id lookup.
--
-- supabaseAdmin.auth.admin.listUsers() has no email filter and pages 50 users by default.
-- lib/auth/findUserByEmail.ts calls this RPC first (fast path) and falls back to a paged
-- listUsers scan when this function is not deployed, so applying this migration is OPTIONAL
-- but recommended once the user base grows.
--
-- Returns the auth.users id for the given email (case-insensitive), or NULL if none.
-- SECURITY DEFINER reads auth.users, so execution is restricted to service_role only.

CREATE OR REPLACE FUNCTION public.find_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_id    uuid;
BEGIN
  IF v_email = '' THEN
    RETURN NULL;
  END IF;

  -- GoTrue stores emails lower-cased: try the (unique) email index first.
  SELECT u.id INTO v_id
    FROM auth.users u
   WHERE u.email = v_email
   LIMIT 1;

  IF v_id IS NULL THEN
    -- Legacy rows with mixed-case emails.
    SELECT u.id INTO v_id
      FROM auth.users u
     WHERE lower(u.email) = v_email
     LIMIT 1;
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.find_auth_user_id_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_auth_user_id_by_email(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_auth_user_id_by_email(text) TO service_role;
