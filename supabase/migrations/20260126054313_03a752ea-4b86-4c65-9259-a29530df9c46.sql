-- Add RLS policy for superadmin to view all inquiries
CREATE POLICY "Superadmin can view all inquiries" 
ON public.inquiries 
FOR SELECT 
USING (has_role(auth.uid(), 'superadmin'));

-- Add RLS policy for superadmin to view all profiles
CREATE POLICY "Superadmin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'superadmin'));

-- Add RLS policy for superadmin to manage user roles
CREATE POLICY "Superadmin can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'superadmin'));

-- Add RLS policy for superadmin to delete products
CREATE POLICY "Superadmin can delete products" 
ON public.products 
FOR DELETE 
USING (has_role(auth.uid(), 'superadmin'));

-- Add RLS policy for superadmin to delete jobs
CREATE POLICY "Superadmin can delete jobs" 
ON public.jobs 
FOR DELETE 
USING (has_role(auth.uid(), 'superadmin'));

-- Add RLS policy for superadmin to update featured status
CREATE POLICY "Superadmin can update products" 
ON public.products 
FOR UPDATE 
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update jobs" 
ON public.jobs 
FOR UPDATE 
USING (has_role(auth.uid(), 'superadmin'));