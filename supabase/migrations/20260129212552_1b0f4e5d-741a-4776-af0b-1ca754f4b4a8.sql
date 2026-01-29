-- Create company_wallets table for virtual money accounts
CREATE TABLE public.company_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id)
);

-- Create wallet_transactions table for deposit history
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.company_wallets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'deposit',
  mobile_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create support_conversations table for chatbot
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  requires_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create support_messages table for chatbot messages
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'user', 'bot', 'admin'
  sender_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS for company_wallets
CREATE POLICY "Company owners can view their wallet"
ON public.company_wallets FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies c WHERE c.id = company_wallets.company_id AND c.user_id = auth.uid()
));

CREATE POLICY "Superadmin can view all wallets"
ON public.company_wallets FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update wallets"
ON public.company_wallets FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "System can insert wallets"
ON public.company_wallets FOR INSERT
WITH CHECK (true);

-- RLS for wallet_transactions
CREATE POLICY "Company owners can view their transactions"
ON public.wallet_transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM company_wallets w 
  JOIN companies c ON c.id = w.company_id 
  WHERE w.id = wallet_transactions.wallet_id AND c.user_id = auth.uid()
));

CREATE POLICY "Company owners can create deposit requests"
ON public.wallet_transactions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM company_wallets w 
  JOIN companies c ON c.id = w.company_id 
  WHERE w.id = wallet_transactions.wallet_id AND c.user_id = auth.uid()
));

CREATE POLICY "Superadmin can view all transactions"
ON public.wallet_transactions FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update transactions"
ON public.wallet_transactions FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'));

-- RLS for support_conversations
CREATE POLICY "Users can view own conversations"
ON public.support_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
ON public.support_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.support_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Superadmin can view all conversations"
ON public.support_conversations FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update all conversations"
ON public.support_conversations FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'));

-- RLS for support_messages
CREATE POLICY "Users can view messages in own conversations"
ON public.support_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM support_conversations sc 
  WHERE sc.id = support_messages.conversation_id AND sc.user_id = auth.uid()
));

CREATE POLICY "Users can send messages in own conversations"
ON public.support_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM support_conversations sc 
  WHERE sc.id = support_messages.conversation_id AND sc.user_id = auth.uid()
) OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can view all messages"
ON public.support_messages FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

-- Allow superadmin to delete profiles
CREATE POLICY "Superadmin can delete profiles"
ON public.profiles FOR DELETE
USING (has_role(auth.uid(), 'superadmin'));

-- Trigger to create wallet when company is created
CREATE OR REPLACE FUNCTION public.create_company_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_wallets (company_id, balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_company_created
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.create_company_wallet();

-- Create wallets for existing companies
INSERT INTO public.company_wallets (company_id, balance)
SELECT id, 0 FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.company_wallets);