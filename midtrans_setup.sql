-- Create ENUM for transaction status
create type transaction_status as enum ('pending', 'success', 'failed', 'expired');

-- Create Transactions Table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  order_id text unique not null,
  gross_amount decimal(12,2) not null,
  currency text default 'IDR',
  status transaction_status default 'pending',
  midtrans_token text,
  payment_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Policy: Users can view their own transactions
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);

-- Policy: Service role (Edge Functions) can insert/update
-- (Implicitly allowed for service role, but good to note)
