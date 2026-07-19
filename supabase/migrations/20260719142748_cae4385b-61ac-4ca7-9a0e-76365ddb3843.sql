-- Create private schema and helper
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Rebuild every policy currently referencing public.has_role to use private.has_role.

-- profiles
DROP POLICY IF EXISTS "users view own profile or admins all" ON public.profiles;
CREATE POLICY "users view own profile or admins all" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- users
DROP POLICY IF EXISTS "users view own public user or admins all" ON public.users;
CREATE POLICY "users view own public user or admins all" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- wallets
DROP POLICY IF EXISTS "users view own wallet or admins all" ON public.wallets;
DROP POLICY IF EXISTS "admins update wallets" ON public.wallets;
CREATE POLICY "users view own wallet or admins all" ON public.wallets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins update wallets" ON public.wallets
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- transactions
DROP POLICY IF EXISTS "users view own tx or admins all" ON public.transactions;
DROP POLICY IF EXISTS "admins update tx" ON public.transactions;
CREATE POLICY "users view own tx or admins all" ON public.transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins update tx" ON public.transactions
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- chat_messages
DROP POLICY IF EXISTS "users view own chat or admins all" ON public.chat_messages;
DROP POLICY IF EXISTS "users send own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "mark messages read" ON public.chat_messages;
CREATE POLICY "users view own chat or admins all" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "users send own messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND sender = 'user'::public.chat_sender)
    OR (private.has_role(auth.uid(), 'admin'::public.app_role) AND sender = 'admin'::public.chat_sender)
  );
CREATE POLICY "mark messages read" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- notifications
DROP POLICY IF EXISTS "users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "admins insert notifications" ON public.notifications;
CREATE POLICY "users view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- announcements
DROP POLICY IF EXISTS "anyone reads active announcements" ON public.announcements;
DROP POLICY IF EXISTS "admins manage announcements" ON public.announcements;
CREATE POLICY "anyone reads active announcements" ON public.announcements
  FOR SELECT TO anon, authenticated
  USING (active = true OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- user_roles
DROP POLICY IF EXISTS "admins delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "users view own roles" ON public.user_roles;
CREATE POLICY "users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- admin_wallets: restrict reads to admins only
DROP POLICY IF EXISTS "authenticated read admin wallets" ON public.admin_wallets;
DROP POLICY IF EXISTS "admins manage admin wallets" ON public.admin_wallets;
CREATE POLICY "admins read admin wallets" ON public.admin_wallets
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins manage admin wallets" ON public.admin_wallets
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- transactions_admin view
DROP VIEW IF EXISTS public.transactions_admin;
CREATE VIEW public.transactions_admin
WITH (security_invoker = true) AS
SELECT id, user_id, type, asset, amount, wallet_address, status, admin_note, created_at, updated_at
FROM public.transactions t
WHERE private.has_role(auth.uid(), 'admin'::public.app_role);
GRANT SELECT ON public.transactions_admin TO authenticated;

-- Realtime messages: exact per-user channel matching
DROP POLICY IF EXISTS "authenticated can subscribe to own topic" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated can broadcast to own topic" ON realtime.messages;
CREATE POLICY "authenticated can subscribe to own topic" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() = 'announcements-banner'
    OR realtime.topic() = 'dashboard:' || (auth.uid())::text
    OR realtime.topic() = 'notif-page:' || (auth.uid())::text
    OR realtime.topic() = 'notif:' || (auth.uid())::text
    OR realtime.topic() = 'chat:' || (auth.uid())::text
    OR (
      private.has_role(auth.uid(), 'admin'::public.app_role)
      AND realtime.topic() IN ('admin-overview','admin-chats')
    )
  );
CREATE POLICY "authenticated can broadcast to own topic" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    realtime.topic() = 'dashboard:' || (auth.uid())::text
    OR realtime.topic() = 'notif-page:' || (auth.uid())::text
    OR realtime.topic() = 'notif:' || (auth.uid())::text
    OR realtime.topic() = 'chat:' || (auth.uid())::text
    OR private.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Finally, drop the exposed public.has_role so it cannot be probed via RPC.
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);