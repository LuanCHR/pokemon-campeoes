# Meus campeões Pokémon

Um site onde você cria seu perfil, registra os times que zeraram seus jogos de Pokémon e acompanha ranking, estatísticas e insígnias, e onde seus amigos podem ver tudo isso por um link.

**Site:** https://luanchr.github.io/pokemon-campeoes/

> **Aviso importante: não levo isso a sério.**
> Isso nasceu como um projeto de diversão para mim e meus amigos, para a gente parar de perder a conta de quem zerou o quê, com qual time e com qual apelido (o Snorlax "Mc Ryan" merece ser lembrado). Não é um produto, não tem pretensão de virar empresa e não tem garantia de nada. Se o projeto pausar, quebrar ou mudar, é porque fui jogar. Se for útil para você também, ótimo.

## O que dá para fazer

- **Perfil por link:** cada pessoa tem uma página própria (`/#/u/usuario`), com foto, selos e contadores de seguidores.
- **Times campeões:** registre até 3 times por jogo, em ligas, Copa Craft, PokéRogue e Pokémon Legends: Z-A, com apelido e MVP de cada time.
- **Pokédex de cada jogo:** a lista de Pokémon muda conforme a versão escolhida, inclusive formas regionais (Alola, Galar, Hisui, Paldea) e formas alternativas (como Toxtricity).
- **Modo Nuzlocke:** o time vai para uma categoria separada, com cemitério para os Pokémon que caíram, troféu próprio e uma medalha para cada baixa.
- **Ranking e estatísticas:** pontuação por troféu, Pokémon e tipos mais usados, coleção por geração e filtros.
- **Insígnias:** 8 conquistas numa maletinha, no estilo das insígnias dos jogos.
- **Social:** seguir amigos, ver quem segue quem e compartilhar um cartão do perfil como imagem.
- **Selos de beta tester**, para quem entrou nas primeiras versões.

## Como foi feito

| Parte | Tecnologia |
| --- | --- |
| Site | HTML, CSS e JavaScript puros, sem framework |
| Contas, banco e fotos | Supabase: Auth, Postgres com RLS e Storage |
| Dados dos Pokémon | PokeAPI |
| Hospedagem | GitHub Pages |

Alguns pontos que me deram trabalho e que eu curti resolver:

- **Segurança de verdade no banco:** regras RLS para cada pessoa só mexer no que é dela, limites e validações no próprio Postgres (a regra dos 3 times por jogo não depende do navegador), foto restrita ao Storage do projeto e política de segurança de conteúdo (CSP) no site.
- **Cartão de perfil gerado em canvas**, com sprites em escala exata para os pixels não borrarem.
- **Recuperação de senha, validação de formulários e mensagens de erro em português** para quem não é da área.
- **Design:** várias rodadas para o site deixar de parecer "feito por IA": menos caixas, menos brilho, mais respiro.

Esse projeto também foi construído com ajuda de IA (Claude): eu defini o que queria, revisei, testei com os amigos e fui decidindo o rumo.

## Rodar no seu computador

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. No **SQL Editor**, cole e rode o arquivo `supabase.sql` (pode repetir sem problema).
3. Copie `config.js`, coloque a **URL** e a chave **publishable** do projeto (nunca a chave `secret`).
4. Abra a pasta com o Live Server do VS Code (ou qualquer servidor estático).

Checklist de segurança do painel do Supabase: confirmação de e-mail ligada, senha mínima de 8 caracteres, login anônimo desligado e Redirect URLs só com os endereços que você usa.

## Aviso legal

Projeto feito por fã, sem fins lucrativos e sem relação com Nintendo, Game Freak, Creatures ou The Pokémon Company. Pokémon e os nomes e imagens dos personagens são marcas e propriedade dos respectivos donos. Os dados e sprites vêm da [PokeAPI](https://pokeapi.co). Se algo aqui incomodar os donos dos direitos, é só falar que eu tiro do ar.

---

Feito por [Luan](https://github.com/LuanCHR), estudante procurando estágio em TI.
