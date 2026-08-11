-- Chat-with-your-PDFs: initial schema
-- Compatible with Neon Postgres. Run via: npm run db:migrate

create extension if not exists "pgcrypto";

create table if not exists document_sets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null default 'My documents',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_sets_user_id_idx on document_sets (user_id);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  document_set_id uuid not null references document_sets (id) on delete cascade,
  filename text not null,
  storage_path text not null,
  mime_type text,
  size_bytes integer,
  page_count integer,
  chunk_count integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'indexing', 'ready', 'failed')),
    error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists documents_set_id_idx on documents (document_set_id);
create unique index if not exists documents_set_filename_idx
  on documents (document_set_id, filename);

create table if not exists ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  stage text not null default 'upload'
    check (stage in ('upload', 'parse', 'chunk', 'embed', 'done', 'failed')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  updated_at timestamptz not null default now()
);

create index if not exists ingestion_jobs_document_id_idx on ingestion_jobs (document_id);

-- Storage bucket (create in Supabase dashboard if this fails)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
