-- Create landing page content table for superadmin customization
CREATE TABLE public.landing_page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view landing page content
CREATE POLICY "Anyone can view landing page content"
ON public.landing_page_content FOR SELECT
USING (true);

-- Only superadmin can update landing page content
CREATE POLICY "Superadmin can update landing page content"
ON public.landing_page_content FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'));

-- Only superadmin can insert landing page content
CREATE POLICY "Superadmin can insert landing page content"
ON public.landing_page_content FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- Only superadmin can delete landing page content
CREATE POLICY "Superadmin can delete landing page content"
ON public.landing_page_content FOR DELETE
USING (has_role(auth.uid(), 'superadmin'));

-- Add trigger for updated_at
CREATE TRIGGER update_landing_page_content_updated_at
  BEFORE UPDATE ON public.landing_page_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content
INSERT INTO public.landing_page_content (key, value) VALUES
  ('hero_title', 'Connect. Grow. Succeed.'),
  ('hero_subtitle', 'The ultimate platform connecting companies, job seekers, and customers. Build your network, find opportunities, and grow your business.'),
  ('hero_background_url', ''),
  ('cta_title', 'Ready to Grow Your Business?'),
  ('cta_subtitle', 'Join thousands of companies already using ConnectHub to find talent and reach customers.');