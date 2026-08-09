CREATE POLICY "authenticated users read deposit addresses"
ON public.admin_wallets
FOR SELECT
TO authenticated
USING (true);