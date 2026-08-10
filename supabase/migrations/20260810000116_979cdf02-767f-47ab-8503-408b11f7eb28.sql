-- 1. Restrict broad read of admin deposit wallets
DROP POLICY IF EXISTS "authenticated users read deposit addresses" ON public.admin_wallets;

CREATE OR REPLACE FUNCTION public.get_deposit_address(_asset public.asset_type)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT address
  FROM public.admin_wallets
  WHERE asset = _asset
    AND auth.uid() IS NOT NULL
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_deposit_address(public.asset_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_deposit_address(public.asset_type) TO authenticated;

-- 2. Allow users to create their own wallet row
CREATE POLICY "users create own wallet"
ON public.wallets
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. Allow admins (only) to delete transactions
CREATE POLICY "admins delete transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));
