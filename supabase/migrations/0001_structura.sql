create extension if not exists vector;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  filename text not null, mime_type text not null, document_type text, title text, status text not null default 'queued',
  created_at timestamptz not null default now()
);
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  version integer not null, storage_path text not null, raw_text text, structured_representation jsonb, created_at timestamptz not null default now(),
  unique(document_id, version)
);
create table if not exists public.document_pages (
  id uuid primary key default gen_random_uuid(), version_id uuid not null references public.document_versions(id) on delete cascade,
  page_number integer not null, raw_text text, layout jsonb, unique(version_id, page_number)
);
create table if not exists public.document_sections (
  id uuid primary key default gen_random_uuid(), version_id uuid not null references public.document_versions(id) on delete cascade,
  parent_id uuid references public.document_sections(id) on delete cascade, title text not null, level integer not null, section_order integer not null, content text
);
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(), version_id uuid not null references public.document_versions(id) on delete cascade,
  chunk_index integer not null, content text not null, metadata jsonb not null default '{}'
);
create table if not exists public.document_embeddings (
  chunk_id uuid primary key references public.document_chunks(id) on delete cascade, embedding vector(1536) not null
);
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.users(id) on delete cascade,
  name text not null, document_type text not null, description text, created_at timestamptz not null default now()
);
create table if not exists public.evaluation_rules (
  id uuid primary key default gen_random_uuid(), template_id uuid not null references public.templates(id) on delete cascade,
  name text not null, rule_type text not null, config jsonb not null default '{}'
);
create table if not exists public.document_requirements (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  source text not null, requirement jsonb not null
);
create table if not exists public.document_issues (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  category text not null, severity text not null, explanation text not null, evidence jsonb not null, recommendation text not null,
  confidence numeric not null, affected_section text
);
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  position integer not null, content text not null
);
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  agent_name text not null, status text not null, input jsonb, output jsonb, error text, started_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.agent_feedback (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade, rating integer check (rating between 1 and 5), notes text, created_at timestamptz not null default now()
);
create index if not exists document_embeddings_hnsw on public.document_embeddings using hnsw (embedding vector_cosine_ops);
create index if not exists documents_user_idx on public.documents(user_id, created_at desc);
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_issues enable row level security;
create policy "Users access their documents" on public.documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users access their versions" on public.document_versions for all using (exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid()));
create policy "Users access their issues" on public.document_issues for all using (exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid()));

