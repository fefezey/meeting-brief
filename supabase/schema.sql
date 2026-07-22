-- Aşama 0 şeması. Auth aşama 5'te eklenecek (user_id kolonları + RLS).

create table if not exists documents (
  id                uuid primary key default gen_random_uuid(),
  title             text        not null,
  storage_path      text        not null,
  anthropic_file_id text,
  page_count        int,
  size_bytes        bigint      not null,
  status            text        not null default 'uploading',
  error_message     text,
  created_at        timestamptz not null default now()
);

-- Analiz Paketi. Doküman başına bir satır, JSON olarak saklanır:
-- şema hızlı evrilecek, kolona bölmek erken.
create table if not exists analyses (
  document_id uuid primary key references documents(id) on delete cascade,
  payload     jsonb       not null,
  created_at  timestamptz not null default now()
);

create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid        not null references documents(id) on delete cascade,
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  citations   jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists messages_document_id_created_at_idx
  on messages (document_id, created_at);
