create index if not exists chunks_metadata_gin_idx on chunks using gin (metadata);
create index if not exists chunks_project_id_idx on chunks ((metadata->>'project_id'));
create index if not exists chunks_type_idx on chunks ((metadata->>'type'));
create index if not exists chunks_stack_idx on chunks ((metadata->>'stack'));

create or replace function match_chunks_advanced(
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  match_type text default null,
  match_project_id text default null,
  match_stack text default null
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    chunks.id,
    chunks.content,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where 1 - (chunks.embedding <=> query_embedding) > match_threshold
    and (
      match_type is null
      or chunks.metadata->>'type' = match_type
      or chunks.metadata->>'facet' = match_type
    )
    and (
      match_project_id is null
      or chunks.metadata->>'project_id' = match_project_id
    )
    and (
      match_stack is null
      or lower(coalesce(chunks.metadata->>'stack', '')) = lower(match_stack)
      or exists (
        select 1
        from jsonb_array_elements_text(coalesce(chunks.metadata->'stacks', '[]'::jsonb)) as stack_value
        where lower(stack_value) = lower(match_stack)
      )
    )
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
