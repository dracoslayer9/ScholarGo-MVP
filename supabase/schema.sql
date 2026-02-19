-- Create transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  external_id text unique not null,
  amount numeric not null,
  status text not null default 'pending', -- pending, success, failure, expire
  payment_method text,
  plan_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Policies
create policy "Users can view their own transactions"
  on public.transactions for select
  using ( auth.uid() = user_id );

-- Note: Edge Functions using Service Role Key will bypass RLS for inserts.
