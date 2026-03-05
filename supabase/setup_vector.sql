-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table for storing the anonymized essays and their embeddings
create table if not exists public.knowledge_base (
    id uuid default gen_random_uuid() primary key,
    scholarship_type text not null, -- e.g., 'LPDP', 'GKS'
    document_type text not null, -- e.g., 'Essay', 'Personal Statement'
    original_filename text, -- Keep original filename (without person's name if possible) for reference
    anonymized_content text not null, -- The scrubbed text and writing strategy extracted by GPT-4o-mini
    embedding vector(1536), -- 1536 is the output dimension of OpenAI's text-embedding-3-small
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: We do not enable RLS here initially because this is a server-side only table 
-- that the AI backend will query via the Service Role Key. If the client queries it directly, enable RLS.
