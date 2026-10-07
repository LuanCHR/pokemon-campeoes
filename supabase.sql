-- Meus campeões: tabelas, regras de segurança e limites.

-- ============ Tabelas ============
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  nome text,
  foto_url text,
  criado_em timestamptz not null default now()
);
alter table perfis add column if not exists destaque text;
alter table perfis add column if not exists beta boolean not null default false;
alter table perfis add column if not exists beta2 boolean not null default false;
alter table perfis alter column beta set default false;

create table if not exists jogos (
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
alter table jogos add column if not exists caidos jsonb not null default '[]';

create table if not exists individuais (
  id bigint generated always as identity primary key,
  user_id uuid not null references perfis(id) on delete cascade,
  pokemon int not null,
  trofeu text not null,
  quantidade int not null default 1 check (quantidade > 0)
);

create table if not exists seguindo (
  seguidor uuid not null references perfis(id) on delete cascade,
  seguido uuid not null references perfis(id) on delete cascade,
  primary key (seguidor, seguido),
  check (seguidor <> seguido)
);

-- ============ Regras de acesso (RLS) ============
alter table perfis enable row level security;
alter table jogos enable row level security;
alter table individuais enable row level security;
alter table seguindo enable row level security;

drop policy if exists "perfis: leitura" on perfis;
drop policy if exists "perfis: criar o proprio" on perfis;
drop policy if exists "perfis: editar o proprio" on perfis;
create policy "perfis: leitura" on perfis for select using (true);
create policy "perfis: criar o proprio" on perfis for insert to authenticated with check (id = auth.uid());
create policy "perfis: editar o proprio" on perfis for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "jogos: leitura" on jogos;
drop policy if exists "jogos: inserir" on jogos;
drop policy if exists "jogos: editar" on jogos;
drop policy if exists "jogos: apagar" on jogos;
create policy "jogos: leitura" on jogos for select using (true);
create policy "jogos: inserir" on jogos for insert to authenticated with check (user_id = auth.uid());
create policy "jogos: editar" on jogos for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "jogos: apagar" on jogos for delete to authenticated using (user_id = auth.uid());

drop policy if exists "individuais: leitura" on individuais;
drop policy if exists "individuais: inserir" on individuais;
drop policy if exists "individuais: editar" on individuais;
drop policy if exists "individuais: apagar" on individuais;
create policy "individuais: leitura" on individuais for select using (true);
create policy "individuais: inserir" on individuais for insert to authenticated with check (user_id = auth.uid());
create policy "individuais: editar" on individuais for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "individuais: apagar" on individuais for delete to authenticated using (user_id = auth.uid());

-- Seguir: só quem está logado vê as listas; cada pessoa só mexe nas próprias.
drop policy if exists "seguindo: ver os proprios" on seguindo;
drop policy if exists "seguindo: ver listas" on seguindo;
drop policy if exists "seguindo: seguir" on seguindo;
drop policy if exists "seguindo: deixar de seguir" on seguindo;
create policy "seguindo: ver listas" on seguindo for select to authenticated using (true);
create policy "seguindo: seguir" on seguindo for insert to authenticated with check (seguidor = auth.uid());
create policy "seguindo: deixar de seguir" on seguindo for delete to authenticated using (seguidor = auth.uid());

-- ============ Permissões da API ============
revoke all on public.perfis, public.jogos, public.individuais, public.seguindo from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.perfis, public.jogos, public.individuais to anon, authenticated;
grant select, insert, delete on public.seguindo to authenticated;
grant insert, update, delete on public.jogos, public.individuais to authenticated;
-- perfis: o site só pode gravar estas colunas (os selos beta nunca são editados pelo site)
grant insert (id, username, nome) on public.perfis to authenticated;
grant update (nome, foto_url, destaque) on public.perfis to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ============ Limites e validações (o banco recusa dados fora do normal) ============
-- "not valid" = vale para tudo que for criado ou editado daqui para frente, sem quebrar dados antigos.
alter table perfis drop constraint if exists perfis_nome_ok;
alter table perfis add constraint perfis_nome_ok check (nome is null or char_length(nome) between 1 and 40) not valid;
alter table perfis drop constraint if exists perfis_destaque_ok;
alter table perfis add constraint perfis_destaque_ok check (destaque is null or char_length(destaque) <= 80) not valid;
alter table perfis drop constraint if exists perfis_foto_ok;
alter table perfis add constraint perfis_foto_ok check (foto_url is null or foto_url ~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/fotos/[A-Za-z0-9/_.-]+(\?v=[0-9]+)?$') not valid;
alter table perfis drop constraint if exists perfis_username_reservado;
alter table perfis add constraint perfis_username_reservado check (username not in ('admin','administrador','suporte','support','root','sistema','moderador','mod','oficial','staff','api','www','entrar','criar-perfil')) not valid;

alter table jogos drop constraint if exists jogos_campos_ok;
alter table jogos add constraint jogos_campos_ok check (
  char_length(nome) between 1 and 80
  and trofeu in ('craft','liga','medalha','pokerogue','liga-nuzlocke','medalha-nuzlocke')
  and jsonb_typeof(apelidos) = 'object' and char_length(apelidos::text) <= 1500
  and jsonb_typeof(extras) = 'array' and jsonb_array_length(extras) <= 6 and char_length(extras::text) <= 600
  and jsonb_typeof(caidos) = 'array' and jsonb_array_length(caidos) <= 60 and char_length(caidos::text) <= 4000
) not valid;

alter table individuais drop constraint if exists individuais_campos_ok;
alter table individuais add constraint individuais_campos_ok check (
  pokemon between 1 and 20000 and quantidade <= 999
  and trofeu in ('craft','bola-ouro-craft','liga','bola-ouro-liga','medalha','pokerogue','pokerogue-mvp','liga-nuzlocke','bola-ouro-liga-nuzlocke','medalha-nuzlocke')
) not valid;

-- No máximo 3 times por jogo, 150 times por conta, números de Pokémon válidos.
create or replace function validar_jogo() returns trigger
language plpgsql set search_path = public as $$
declare n int; base text;
begin
  if exists (select 1 from unnest(new."time") x where x < 1 or x > 20000) then
    raise exception 'Número de Pokémon inválido';
  end if;
  base := regexp_replace(new.nome, ' \(\d.? time\)$', '');
  select count(*) into n from jogos
    where user_id = new.user_id and id is distinct from new.id
      and regexp_replace(nome, ' \(\d.? time\)$', '') = base;
  if n >= 3 then raise exception 'Você já tem 3 times em %', base; end if;
  select count(*) into n from jogos where user_id = new.user_id and id is distinct from new.id;
  if n >= 150 then raise exception 'Limite de times da conta atingido'; end if;
  return new;
end $$;
drop trigger if exists validar_jogo on jogos;
create trigger validar_jogo before insert or update of nome, "time", user_id on jogos for each row execute function validar_jogo();

create or replace function limitar_individuais() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from individuais where user_id = new.user_id) >= 500 then
    raise exception 'Limite de títulos da conta atingido';
  end if;
  return new;
end $$;
drop trigger if exists limitar_individuais on individuais;
create trigger limitar_individuais before insert on individuais for each row execute function limitar_individuais();

create or replace function limitar_seguindo() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from seguindo where seguidor = new.seguidor) >= 1000 then
    raise exception 'Limite de pessoas seguidas atingido';
  end if;
  return new;
end $$;
drop trigger if exists limitar_seguindo on seguindo;
create trigger limitar_seguindo before insert on seguindo for each row execute function limitar_seguindo();

-- ============ Fotos de perfil ============
-- Pasta pública "fotos": cada pessoa só grava na própria pasta, até 1 MB, só imagem.
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true) on conflict (id) do nothing;
update storage.buckets set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'fotos';
drop policy if exists "fotos: leitura" on storage.objects;
drop policy if exists "fotos: enviar" on storage.objects;
drop policy if exists "fotos: trocar" on storage.objects;
drop policy if exists "fotos: apagar" on storage.objects;
create policy "fotos: leitura" on storage.objects for select using (bucket_id = 'fotos');
create policy "fotos: enviar" on storage.objects for insert to authenticated with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: trocar" on storage.objects for update to authenticated using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: apagar" on storage.objects for delete to authenticated using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function ganhar_beta2() returns void
language sql security definer set search_path = public as $$
  update perfis set beta2 = true where id = auth.uid();
$$;
revoke all on function ganhar_beta2() from public, anon;
grant execute on function ganhar_beta2() to authenticated;
