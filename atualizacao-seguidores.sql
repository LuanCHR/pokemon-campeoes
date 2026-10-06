-- Rode no Supabase: SQL Editor > New query > cole tudo > Run
-- Permite que quem está logado veja as listas de seguidores e de quem cada pessoa segue.
drop policy if exists "seguindo: ver os proprios" on seguindo;
drop policy if exists "seguindo: ver listas" on seguindo;
create policy "seguindo: ver listas" on seguindo for select to authenticated using (true);
