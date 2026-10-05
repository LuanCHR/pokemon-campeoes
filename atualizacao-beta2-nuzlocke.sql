-- Rode no Supabase: SQL Editor > New query > cole tudo > Run

-- Selo "Beta tester 2" e novos times Nuzlocke (cemitério)
alter table public.perfis add column if not exists beta2 boolean not null default false;
alter table public.perfis alter column beta set default false;   -- contas novas não ganham mais o Beta tester 1
alter table public.jogos  add column if not exists caidos jsonb not null default '[]';

-- Quem entra no site ganha o Beta tester 2 (o próprio usuário só consegue marcar a si mesmo)
create or replace function public.ganhar_beta2() returns void
language sql security definer set search_path = public as $$
  update public.perfis set beta2 = true where id = auth.uid();
$$;
revoke all on function public.ganhar_beta2() from public, anon;
grant execute on function public.ganhar_beta2() to authenticated;
