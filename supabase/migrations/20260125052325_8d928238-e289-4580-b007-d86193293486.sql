-- Create storage buckets for media
INSERT INTO storage.buckets (id, name, public) VALUES ('product-media', 'product-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('job-media', 'job-media', true);

-- Storage policies for product media
CREATE POLICY "Anyone can view product media" ON storage.objects FOR SELECT USING (bucket_id = 'product-media');
CREATE POLICY "Company owners can upload product media" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-media' AND 
  auth.uid() IS NOT NULL
);
CREATE POLICY "Company owners can delete product media" ON storage.objects FOR DELETE USING (
  bucket_id = 'product-media' AND 
  auth.uid() IS NOT NULL
);

-- Storage policies for job media
CREATE POLICY "Anyone can view job media" ON storage.objects FOR SELECT USING (bucket_id = 'job-media');
CREATE POLICY "Company owners can upload job media" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'job-media' AND 
  auth.uid() IS NOT NULL
);
CREATE POLICY "Company owners can delete job media" ON storage.objects FOR DELETE USING (
  bucket_id = 'job-media' AND 
  auth.uid() IS NOT NULL
);

-- Create product_media table for multiple images/videos per product
CREATE TABLE public.product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product media" ON public.product_media FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN companies c ON c.id = p.company_id
    WHERE p.id = product_media.product_id AND (c.status = 'approved' OR c.user_id = auth.uid() OR has_role(auth.uid(), 'superadmin'))
  )
);

CREATE POLICY "Company owners can insert product media" ON public.product_media FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM products p
    JOIN companies c ON c.id = p.company_id
    WHERE p.id = product_media.product_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can delete product media" ON public.product_media FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN companies c ON c.id = p.company_id
    WHERE p.id = product_media.product_id AND c.user_id = auth.uid()
  )
);

-- Create job_media table for images/videos per job
CREATE TABLE public.job_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view job media" ON public.job_media FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.id = job_media.job_id AND (c.status = 'approved' OR c.user_id = auth.uid() OR has_role(auth.uid(), 'superadmin'))
  )
);

CREATE POLICY "Company owners can insert job media" ON public.job_media FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.id = job_media.job_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can delete job media" ON public.job_media FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.id = job_media.job_id AND c.user_id = auth.uid()
  )
);

-- Create inquiries table for interest tracking
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT inquiry_type CHECK (product_id IS NOT NULL OR job_id IS NOT NULL)
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inquiries" ON public.inquiries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Company owners can view inquiries for their company" ON public.inquiries FOR SELECT USING (
  EXISTS (SELECT 1 FROM companies WHERE id = inquiries.company_id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create inquiries" ON public.inquiries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Company owners can update inquiry status" ON public.inquiries FOR UPDATE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = inquiries.company_id AND user_id = auth.uid())
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inquiry participants can view messages" ON public.chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM inquiries i
    WHERE i.id = chat_messages.inquiry_id 
    AND (i.user_id = auth.uid() OR EXISTS (SELECT 1 FROM companies c WHERE c.id = i.company_id AND c.user_id = auth.uid()))
  )
);

CREATE POLICY "Inquiry participants can send messages" ON public.chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM inquiries i
    WHERE i.id = chat_messages.inquiry_id 
    AND (i.user_id = auth.uid() OR EXISTS (SELECT 1 FROM companies c WHERE c.id = i.company_id AND c.user_id = auth.uid()))
  )
);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;

-- Add featured flag to products and jobs
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create trigger for updated_at on inquiries
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();