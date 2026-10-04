# Meus campeões Pokémon (com perfis)

Site onde cada pessoa cria um perfil, cadastra seus times campeões e vê ranking, times, Pokémon mais usado e perfil de cada Pokémon. Os perfis são acessados por link (`seusite/#/u/nomedeusuario`). Não existe home nem busca: só se chega a alguém pelo link. Dá para seguir pessoas.

## Arquivos
- `index.html`, `style.css`, `script.js`: o site.
- `config.js`: onde você cola a URL e a chave do Supabase.
- `supabase.sql`: cria as tabelas, as regras de segurança e a pasta de fotos.
- `trofeus.json`: lista de troféus e pesos (vale para todos os perfis).
- `img/trofeus/`: imagens dos troféus. `img/mvp.png`: símbolo do MVP.
- `dados.json`: seus dados antigos. O site não lê mais esse arquivo; use-o só para importar (passo 8).

## Parte A: fora do VS Code (no site do Supabase)
1. Crie uma conta em supabase.com (pode entrar com o GitHub) e clique em **New project**. Escolha um nome, anote a senha do banco e use a região **South America (São Paulo)**. Espere uns 2 minutos.
2. No menu da esquerda, abra **SQL Editor > New query**. Cole todo o conteúdo de `supabase.sql` e clique em **Run**. Rode só uma vez.
3. Em **Authentication > Sign In / Providers > Email**, deixe o e-mail ativado. Para testar mais fácil, desligue **Confirm email**. Se deixar ligado, quem criar conta precisa clicar no e-mail de confirmação antes de entrar.
4. Em **Authentication > URL Configuration**, adicione `http://127.0.0.1:5500` em **Redirect URLs** (é o endereço do Live Server). Depois de publicar, coloque o endereço do GitHub Pages em **Site URL**.
5. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.

## Parte B: no VS Code
6. Substitua os arquivos do projeto pelos deste zip e mantenha a pasta `img` (agora com `mvp.png`).
7. Abra `config.js` e cole a URL e a chave do passo 5. Nunca use a chave `service_role`.
8. Abra o site com o Live Server, crie sua conta e escolha o nome de usuário. Depois vá em **Adicionar > Importar arquivo** e escolha o seu `dados.json` antigo. Seus times e títulos entram na sua conta.

## Parte C: publicar
9. Envie tudo para o GitHub, ative o GitHub Pages (Settings > Pages) e atualize o **Site URL** do passo 4.

## Observações
- A chave anon pode ficar no código. Quem protege os dados são as regras do `supabase.sql`: cada pessoa só altera o que é dela.
- Os perfis são públicos para quem tem o link. A tela não lista ninguém, mas tecnicamente os dados podem ser lidos pela API.
- No plano gratuito, o Supabase pausa o projeto depois de uns 7 dias sem uso. É só reativar no painel.
- Para mudar o peso ou o nome de um troféu, edite `trofeus.json`.
