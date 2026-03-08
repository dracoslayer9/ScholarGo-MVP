create table if not exists public.university_knowledge_base (
    id uuid default gen_random_uuid() primary key,
    university_name text not null,
    country text not null,
    target_major text not null,
    focus_area text not null,
    curated_profile text not null,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function match_universities (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  university_name text,
  country text,
  target_major text,
  focus_area text,
  curated_profile text,
  similarity float
)
language sql stable
as $$
  select
    ukb.id,
    ukb.university_name,
    ukb.country,
    ukb.target_major,
    ukb.focus_area,
    ukb.curated_profile,
    1 - (ukb.embedding <=> query_embedding) as similarity
  from university_knowledge_base ukb
  where 1 - (ukb.embedding <=> query_embedding) > match_threshold
  order by ukb.embedding <=> query_embedding
  limit match_count;
$$;
