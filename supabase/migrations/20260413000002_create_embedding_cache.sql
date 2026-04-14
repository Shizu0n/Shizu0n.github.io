create table embedding_cache (
  query_hash text primary key,
  query_normalized text not null,
  embedding vector(3072) not null,
  created_at timestamptz default now()
);

-- Auto-cleanup de entries > 24h
create or replace function clean_old_embeddings()
returns void language sql as $$
  delete from embedding_cache 
  where created_at < now() - interval '24 hours';
$$;

alter table embedding_cache enable row level security;
create policy "Service role full access" on embedding_cache
  to service_role using (true) with check (true);
