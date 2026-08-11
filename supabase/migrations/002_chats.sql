-- Chat persistence
-- Compatible with Neon Postgres. Run via: npm run db:migrate

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  document_set_id uuid not null references document_sets (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chats_user_id_idx on chats (user_id);
create index if not exists chats_document_set_id_idx on chats (document_set_id);
create index if not exists chats_updated_at_idx on chats (updated_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  sources jsonb,
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_id_idx on messages (chat_id);
create index if not exists messages_created_at_idx on messages (created_at);
