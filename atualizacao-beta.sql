-- Rode no SQL Editor do Supabase (uma vez).
-- 1) coluna do selo de beta tester (quem ja tem perfil recebe o selo)
alter table perfis add column if not exists beta boolean not null default true;
-- 2) o site passa a poder gravar so estas colunas em perfis (ninguem se da o selo sozinho)
revoke insert, update on public.perfis from authenticated;
grant insert (id, username, nome) on public.perfis to authenticated;
grant update (nome, foto_url, destaque) on public.perfis to authenticated;
-- Quando a beta acabar, rode so esta linha:
-- alter table perfis alter column beta set default false;
