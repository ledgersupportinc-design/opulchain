CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_active ON public.announcements(active, created_at DESC);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads active announcements"
  ON public.announcements FOR SELECT TO authenticated, anon
  USING (active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage announcements"
  ON public.announcements FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.validate_announcement_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.type NOT IN ('info', 'warning', 'urgent') THEN
    RAISE EXCEPTION 'Invalid announcement type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_announcement_type
  BEFORE INSERT OR UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.validate_announcement_type();

CREATE OR REPLACE FUNCTION public.fanout_announcement_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.active = true AND (TG_OP = 'INSERT' OR OLD.active = false) THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    SELECT p.id, 'announcement', 'New Announcement', NEW.message
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fanout_announcement
  AFTER INSERT OR UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.fanout_announcement_notification();

CREATE OR REPLACE FUNCTION public.notify_on_tx_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title text; v_message text; v_type text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.type = 'deposit' AND NEW.status = 'completed' THEN
    v_type := 'deposit_approved';
    v_title := 'Deposit Approved';
    v_message := 'Your ' || NEW.amount || ' ' || NEW.asset || ' deposit has been credited.';
  ELSIF NEW.type = 'withdrawal' AND NEW.status = 'completed' THEN
    v_type := 'withdrawal_processed';
    v_title := 'Withdrawal Processed';
    v_message := 'Your ' || NEW.amount || ' ' || NEW.asset || ' withdrawal was sent successfully.';
  ELSIF NEW.type = 'withdrawal' AND NEW.status = 'rejected' THEN
    v_type := 'withdrawal_rejected';
    v_title := 'Withdrawal Rejected';
    v_message := COALESCE('Your withdrawal request was not approved. Reason: ' || NEW.admin_note, 'Your withdrawal request was not approved.');
  ELSE
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (NEW.user_id, v_type, v_title, v_message, '/dashboard');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_tx_status
  AFTER UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_tx_status_change();

CREATE OR REPLACE FUNCTION public.notify_on_admin_chat()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.sender = 'admin' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (NEW.user_id, 'support_reply', 'New Support Reply', 'OpulChain Support replied to your message.', '/dashboard');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_chat
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_admin_chat();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;