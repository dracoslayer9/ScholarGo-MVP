-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Create or Update Profiles Table
-- Ensure the table exists
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- 2. Add Usage Columns (Safe to run even if table exists)
alter table public.profiles 
add column if not exists plan_type text default 'free';

alter table public.profiles 
add column if not exists usage_pdf_analysis integer default 0;

alter table public.profiles 
add column if not exists usage_chat integer default 0;

alter table public.profiles 
add column if not exists usage_deep_review integer default 0;

-- 3. Enable RLS (Security)
alter table public.profiles enable row level security;

-- 4. Create Policies (If not exist - Supabase doesn't support 'create policy if not exists' cleanly in one line, 
--    so we wrap in a DO block or just let it fail/ignore if they exist. 
--    Below are standard policies. If they exist, these lines will error, which is fine.)

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Public profiles are viewable by everyone.') then
    create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can insert their own profile.') then
    create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update own profile.') then
    create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );
  end if;
end
$$;

-- 5. Set up Storage (For PDF Uploads if needed, optional but recommended)
--    Note: PDF storage bucket setup is usually done in UI, but SQL can do it if extensions enabled.
--    We'll skip for now to keep it simple.
