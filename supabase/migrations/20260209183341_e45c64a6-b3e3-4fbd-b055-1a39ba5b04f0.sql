
-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  duration_days integer NOT NULL,
  features text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, price, duration_days, features) VALUES
  ('Basic', 50000, 30, ARRAY['Post up to 5 jobs', 'Post up to 10 products', 'Basic support']),
  ('Standard', 100000, 60, ARRAY['Post up to 15 jobs', 'Post up to 30 products', 'Priority support', 'Featured listings']),
  ('Premium', 200000, 90, ARRAY['Unlimited jobs', 'Unlimited products', 'Dedicated support', 'Featured listings', 'Analytics dashboard']);

-- Add subscription tracking columns to companies
ALTER TABLE public.companies 
ADD COLUMN subscription_plan_id uuid REFERENCES public.subscription_plans(id),
ADD COLUMN subscription_expires_at timestamp with time zone,
ADD COLUMN subscription_started_at timestamp with time zone;

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view plans
CREATE POLICY "Anyone can view plans" ON public.subscription_plans
FOR SELECT USING (true);

-- Only superadmin can manage plans
CREATE POLICY "Superadmin can insert plans" ON public.subscription_plans
FOR INSERT WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update plans" ON public.subscription_plans
FOR UPDATE USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete plans" ON public.subscription_plans
FOR DELETE USING (has_role(auth.uid(), 'superadmin'));
