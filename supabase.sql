-- Meus campeões: tabelas, regras de segurança e fotos de perfil.
-- Rode UMA vez: Supabase > SQL Editor > New query > cole tudo > Run.

create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  nome text,
  foto_url text,
  criado_em timestamptz not null default now()
);

create table jogos (
  id bigint generated always as identity primary key,
  user_id uuid not null references perfis(id) on delete cascade,
  nome text not null,
  trofeu text not null,
  "time" int[] not null check (array_length("time", 1) between 1 and 6),
  apelidos jsonb not null default '{}',
  extras jsonb not null default '[]',
  criado_em timestamptz not null default now(),
  unique (user_id, nome)
);

create table individuais (
  id bigint generated always as identity primary key,
  user_id uuid not null references perfis(id) on delete cascade,
  pokemon int not null,
  trofeu text not null,
  quantidade int not null default 1 check (quantidade > 0)
);

create table seguindo (
  seguidor uuid not null references perfis(id) on delete cascade,
  seguido uuid not null references perfis(id) on delete cascade,
  primary key (seguidor, seguido),
  check (seguidor <> seguido)
);

alter table perfis enable row level security;
alter table jogos enable row level security;
alter table individuais enable row level security;
alter table seguindo enable row level security;

-- Perfis: qualquer pessoa com o link lê; só o dono cria e edita o próprio.
create policy "perfis: leitura" on perfis for select using (true);
create policy "perfis: criar o proprio" on perfis for insert to authenticated with check (id = auth.uid());
create policy "perfis: editar o proprio" on perfis for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Jogos e títulos: leitura aberta, escrita só do dono.
create policy "jogos: leitura" on jogos for select using (true);
create policy "jogos: inserir" on jogos for insert to authenticated with check (user_id = auth.uid());
create policy "jogos: editar" on jogos for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "jogos: apagar" on jogos for delete to authenticated using (user_id = auth.uid());

create policy "individuais: leitura" on individuais for select using (true);
create policy "individuais: inserir" on individuais for insert to authenticated with check (user_id = auth.uid());
create policy "individuais: editar" on individuais for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "individuais: apagar" on individuais for delete to authenticated using (user_id = auth.uid());

-- Seguir: cada pessoa só vê e mexe na própria lista.
create policy "seguindo: ver listas" on seguindo for select to authenticated using (true);
create policy "seguindo: seguir" on seguindo for insert to authenticated with check (seguidor = auth.uid());
create policy "seguindo: deixar de seguir" on seguindo for delete to authenticated using (seguidor = auth.uid());

-- Fotos de perfil: pasta pública "fotos"; cada pessoa só grava na própria pasta (id do usuário).
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true) on conflict (id) do nothing;
create policy "fotos: leitura" on storage.objects for select using (bucket_id = 'fotos');
create policy "fotos: enviar" on storage.objects for insert to authenticated with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: trocar" on storage.objects for update to authenticated using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: apagar" on storage.objects for delete to authenticated using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Colunas extras de perfis: time de destaque e selo de beta tester.
-- Selo: quem cria o perfil enquanto o padrao for true recebe o selo. Quando a beta acabar, rode:
--   alter table perfis alter column beta set default false;
alter table perfis add column if not exists destaque text;
alter table perfis add column if not exists beta boolean not null default false;

-- Permissões da API (obrigatório em projetos criados depois de 30/05/2026:
-- tabelas novas não ficam liberadas automaticamente para o site).
-- Visitantes (anon) só leem; quem está logado (authenticated) também escreve, e as regras acima limitam ao próprio dono.
grant usage on schema public to anon, authenticated;
grant select on public.perfis, public.jogos, public.individuais to anon, authenticated;
-- perfis: o site só pode gravar estas colunas (a coluna beta nunca é editada pelo site)
grant insert (id, username, nome) on public.perfis to authenticated;
grant update (nome, foto_url, destaque) on public.perfis to authenticated;
grant insert, update, delete on public.jogos, public.individuais to authenticated;
grant select, insert, delete on public.seguindo to authenticated;
grant usage, select on all sequences in schema public to authenticated;
-- Selo "Beta tester 2" e novos times Nuzlocke (cemitério)
alter table perfis add column if not exists beta2 boolean not null default false;
alter table perfis alter column beta set default false;   -- contas novas não ganham mais o Beta tester 1
alter table jogos  add column if not exists caidos jsonb not null default '[]';

-- Quem entra no site ganha o Beta tester 2 (o próprio usuário só consegue marcar a si mesmo)
create or replace function ganhar_beta2() returns void
language sql security definer set search_path = public as $$
  update perfis set beta2 = true where id = auth.uid();
$$;
revoke all on function ganhar_beta2() from public, anon;
grant execute on function ganhar_beta2() to authenticated;
