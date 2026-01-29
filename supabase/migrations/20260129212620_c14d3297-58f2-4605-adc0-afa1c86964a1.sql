-- Fix overly permissive RLS policy for company_wallets
DROP POLICY IF EXISTS "System can insert wallets" ON public.company_wallets;

-- Only allow wallet creation through the trigger (security definer function)
-- No direct inserts needed from users