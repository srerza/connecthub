
ALTER TABLE public.subscription_plans
ADD COLUMN max_jobs integer NOT NULL DEFAULT 5,
ADD COLUMN max_products integer NOT NULL DEFAULT 10;

UPDATE public.subscription_plans SET max_jobs = 5, max_products = 10 WHERE name = 'Basic';
UPDATE public.subscription_plans SET max_jobs = 15, max_products = 30 WHERE name = 'Standard';
UPDATE public.subscription_plans SET max_jobs = 50, max_products = 100 WHERE name = 'Premium';
