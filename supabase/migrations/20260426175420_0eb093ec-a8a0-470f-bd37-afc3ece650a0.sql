
-- Admin-managed deposit wallet addresses shown to users
CREATE TABLE public.admin_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset public.asset_type NOT NULL UNIQUE,
  address TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_wallets ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read so the deposit modal can render
CREATE POLICY "authenticated read admin wallets"
  ON public.admin_wallets FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert / update / delete
CREATE POLICY "admins manage admin wallets"
  ON public.admin_wallets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Maintain updated_at via existing helper
CREATE TRIGGER admin_wallets_set_updated_at
  BEFORE UPDATE ON public.admin_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Seed empty rows so admins can edit them in place
INSERT INTO public.admin_wallets (asset, address) VALUES ('BTC', '');
INSERT INTO public.admin_wallets (asset, address) VALUES ('USDT', '');
