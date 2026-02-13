-- Create ENUM for transaction status (if not exists)
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'paid', 'expired', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Transactions Table for Xendit
-- Replaces previous structure if necessary, or create new
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  external_id text UNIQUE NOT NULL, -- Xendit External ID (e.g. invoice ID)
  amount decimal(12,2) NOT NULL,
  status transaction_status DEFAULT 'pending',
  payment_link text, -- The Xendit Invoice URL
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can insert/update (implicitly allowed, but good to verify RLS doesn't block)
