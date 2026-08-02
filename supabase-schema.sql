create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('Owner', 'Board', 'Admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.official_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  record_id text not null,
  visibility text not null check (visibility in ('public', 'protected')),
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  uploaded_by text not null,
  uploaded_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.official_documents enable row level security;

create policy "profiles can read their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "users can create their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "public documents are readable by everyone"
on public.official_documents for select
using (visibility = 'public');

create policy "protected documents are readable by signed-in users"
on public.official_documents for select
using (auth.role() = 'authenticated');

create policy "admins can insert documents"
on public.official_documents for insert
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Admin'
  )
);

create policy "admins can delete documents"
on public.official_documents for delete
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Admin'
  )
);

insert into storage.buckets (id, name, public)
values ('official-documents', 'official-documents', false)
on conflict (id) do nothing;

create policy "authenticated users can read official document files"
on storage.objects for select
using (
  bucket_id = 'official-documents'
  and (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.official_documents
      where storage_path = storage.objects.name
      and visibility = 'public'
    )
  )
);

create policy "admins can upload official document files"
on storage.objects for insert
with check (
  bucket_id = 'official-documents'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Admin'
  )
);

create policy "admins can delete official document files"
on storage.objects for delete
using (
  bucket_id = 'official-documents'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Admin'
  )
);
