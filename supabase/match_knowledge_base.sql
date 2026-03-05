-- Create a function to search for knowledge base strategy embeddings
create or replace function match_knowledge_base (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  scholarship_type text,
  document_type text,
  anonymized_content text,
  similarity float
)
language sql stable
as $$
  select
    knowledge_base.id,
    knowledge_base.scholarship_type,
    knowledge_base.document_type,
    knowledge_base.anonymized_content,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by knowledge_base.embedding <=> query_embedding
  limit match_count;
$$;
