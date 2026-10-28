# App Financeiro: especificação da v1

Documento gerado a partir da sessão de alinhamento (grilling) de 2026-10-28. Registra as decisões tomadas, o escopo da v1 e a ordem de construção. Mudanças de rumo devem atualizar este arquivo.

## Visão

App pessoal para controlar gastos e acompanhar um orçamento mensal. Uso individual, lançamento 100% manual, acessível pelo PC e pelo celular.

## Decisões

| # | Tema | Decisão |
|---|------|---------|
| Q2 | Usuários | Uso pessoal (um único usuário). |
| Q3 | Problema | Registrar gastos e comparar com um orçamento mensal. |
| Q4 | Entrada de dados | Somente manual. Automação (importação, Open Finance) fica para o futuro. |
| Q5 | Plataforma | Web responsiva, usada no PC e no celular. |
| Q7 | Banco | Supabase (Postgres hospedado), projetos separados de dev e prod. |
| Q8 | Login | E-mail com Supabase Auth, usuário único, RLS desde o início. |
| Q9 | Front-end | Vite + React + **JavaScript** (sem TypeScript) + Tailwind. SPA falando direto com o Supabase. |
| Q10 | Hospedagem | Vercel, com deploy automático a partir do GitHub. |
| Q11 | Modelo de dados | Transação, Categoria e Orçamento. Sem contas na v1 (saldo único). |
| Q12 | Cartão e parcelas | Fora da v1. Cada gasto é lançado na data em que ocorreu. |
| Q13 | Moeda e idioma | Apenas BRL, interface em pt-BR, datas dd/mm/aaaa. |
| Q15 | Orçamento | Limite fixo por categoria, vale para todos os meses. Só para despesas. |
| Q16 | Mês | Mês-calendário (dia 1 ao último dia). |
| Q17 | Categorias iniciais | Lista pré-criada, editável e apagável. |
| Q18 | Apagar categoria | As transações viram "Sem categoria". Nada é apagado em cascata. |
| Q19 | Telas | Login, Resumo do mês, Transações, Categorias (com orçamento). |
| Q20 | Alerta de orçamento | Barra de progresso: verde até 80%, amarela de 80% a 100%, vermelha ao estourar. Só visual, sem bloqueio nem notificação. |
| Q21 | Valores | `numeric(12,2)` no banco. Entrada em formato brasileiro ("12,50"). |
| Q22 | Ambientes | Dois projetos Supabase (dev e prod). Estrutura do banco em migrações versionadas em `supabase/migrations/`. |
| Q23 | Repositório | App na raiz. `main` é produção; mudanças por branch. |
| Q24 | Testes | Vitest para cálculo de dinheiro e orçamento, mais testes das regras RLS. Telas sem teste automatizado na v1. |

## Escopo da v1

**Entra**
- Login por e-mail.
- Cadastro, edição, exclusão e listagem de transações (receita ou despesa), com filtro por categoria.
- Categorias editáveis, com lista inicial (Mercado, Moradia, Transporte, Saúde, Lazer, Educação, Outros e uma de receita como Salário).
- Orçamento: limite fixo por categoria de despesa.
- Resumo do mês: receitas, despesas, saldo e gasto versus limite por categoria.

**Fica de fora (candidatas à v2)**
- Gráficos, alertas fora do app, lançamentos recorrentes, exportação.
- Contas (banco, carteira), cartão de crédito, parcelas.
- Ciclo mensal por dia de pagamento, orçamento por mês específico.
- Importação de extrato e Open Finance.
- Múltiplos usuários.

## Modelo de dados (rascunho)

- **categories**: id, user_id, nome, tipo (receita ou despesa), limite mensal (nulo quando não há orçamento).
- **transactions**: id, user_id, data, valor `numeric(12,2)`, descrição, tipo (receita ou despesa), category_id (nulo = "Sem categoria", `on delete set null`).
- Todas as tabelas com RLS: cada linha só é lida e escrita pelo dono (`user_id = auth.uid()`).

O orçamento fica como coluna de `categories` por ser limite fixo (Q15). Se virar limite por mês, passa a ser uma tabela própria.

## Navegação

- **Celular:** barra fixa embaixo com as telas principais e botão "+" flutuante para lançar um gasto rápido.
- **PC:** mesmo conteúdo com menu lateral.

## Ordem de construção

Cada fatia deve ficar usável e testada antes da próxima.

1. **Fundação:** projeto Vite + React + JS + Tailwind, ligado à Vercel e ao Supabase de dev, com deploy funcionando.
2. **Login:** autenticação por e-mail e tabelas com RLS, com teste.
3. **Categorias:** tela de categorias com a lista inicial.
4. **Transações:** lançar, editar, apagar e listar, com o botão "+".
5. **Orçamento e Resumo:** limites por categoria, barras de progresso e totais do mês.
6. **Polimento:** layout no celular e passagem para o projeto de produção.

## Ambiente de desenvolvimento

Node.js, npm, Git, GitHub CLI (`gh`) e Supabase CLI instalados. Repositório: `PietroMelle/app-financeiro`.
