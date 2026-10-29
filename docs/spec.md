# App Financeiro: especificação da v1

Documento gerado a partir da sessão de alinhamento (grilling) de 2026-10-28. Registra as decisões tomadas, o escopo da v1 e a ordem de construção. Mudanças de rumo devem atualizar este arquivo.

## Visão

App pessoal para controlar gastos e acompanhar um orçamento mensal. Uso individual, lançamento 100% manual, acessível pelo PC e pelo celular.

## Decisões

| # | Tema | Decisão |
|---|------|---------|
| Q2 | Usuários | Uso pessoal, com cadastro aberto: outras pessoas podem criar conta no futuro. Cada usuário só vê os próprios dados (RLS). |
| Q3 | Problema | Registrar gastos e comparar com um orçamento mensal. |
| Q4 | Entrada de dados | Somente manual. Automação (importação, Open Finance) fica para o futuro. |
| Q5 | Plataforma | Web responsiva, usada no PC e no celular. |
| Q7 | Banco | Supabase (Postgres hospedado), projetos separados de dev e prod. |
| Q8 | Login | E-mail e senha com Supabase Auth, confirmação por e-mail, RLS desde o início. |
| Q9 | Front-end | Vite + React + **JavaScript** (sem TypeScript) + Tailwind. SPA falando direto com o Supabase. |
| Q10 | Hospedagem | Vercel, com deploy automático a partir do GitHub. |
| Q11 | Modelo de dados | Transação, Categoria e Orçamento. Sem contas na v1 (saldo único). |
| Q12 | Cartão e parcelas | Fora da v1. Cada gasto é lançado na data em que ocorreu. |
| Q13 | Moeda e idioma | Apenas BRL, interface em pt-BR, datas dd/mm/aaaa. |
| Q15 | Orçamento | Limite fixo por categoria, vale para todos os meses. Só para despesas. |
| Q16 | Mês | Mês-calendário (dia 1 ao último dia). |
| Q17 | Categorias iniciais | Lista pré-criada, editável e apagável. |
| Q18 | Apagar categoria | As transações viram "Sem categoria". Nada é apagado em cascata. |
| Q19 | Telas | Login, Resumo do mês, Transações, Categorias (com orçamento) e Conta (e-mail e sair). |
| Q20 | Alerta de orçamento | Barra de progresso: verde até 80%, amarela de 80% a 100%, vermelha ao estourar. Só visual, sem bloqueio nem notificação. |
| Q21 | Valores | `numeric(12,2)` no banco. Entrada em formato brasileiro ("12,50"). |
| Q22 | Ambientes | Um projeto Supabase de produção em São Paulo (`sa-east-1`), "MEA - Finanças (prod)". O plano gratuito limita a 2 projetos ativos e o outro é de outro app, então não há projeto de dev na nuvem: testes usam dados marcados "[teste]" e são apagados no fim. Estrutura do banco em migrações versionadas em `supabase/migrations/`. |
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
- Compartilhar dados entre usuários (ex.: orçamento de casal).

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

## v2: inspirações e decisões

v1 concluída em 2026-10-28 (fatias 1 a 6). A v2 parte de dois produtos brasileiros de referência.

### Referências

- **Dinzo** ([dinzo.com.br](https://dinzo.com.br/)): assistente "Dino" (lança por texto, áudio e foto; "mercado 184"), Resumo com saudação, saldo, metas e alertas de limite, "Disponível para gastar", barras por categoria, metas de reserva, assinaturas recorrentes, fatura de cartão e parcelamentos, relatórios e projeção de saldo, exportação, gamificação (missões, ofensiva) e fechamento do mês em story. Tom informal, "sem julgamento", com mascote.
- **Optio** ([optio.com.br](https://www.optio.com.br/)): "Sua vida financeira em um só lugar". Open Finance com mais de 100 bancos, visão consolidada de contas, cartões e investimentos, assistente de IA que monta orçamento e limites conversando, metas, recorrentes, compartilhamento familiar, biometria. Posicionamento de plataforma completa.

### Decisões

| # | Tema | Decisão |
|---|------|---------|
| Q28 | Identidade | Plataforma completa e séria, no estilo Optio: tom profissional, sem mascote e sem gamificação (sem ofensiva, missões ou story de fim de mês). Mantém o design system atual. |
| Q29 | Escopo da v2 | Nesta ordem: (1) Resumo mais rico, (2) lançamento rápido por texto, (3) recorrentes e assinaturas, (4) metas e reservas, (5) gráficos do mês. (O 6º, PWA, saiu na Q39.) |
| Q30 | IA | Fica para depois. O lançamento rápido funciona sem IA, com regras no próprio app. |
| Q32 | Resumo | Saudação "Boa tarde, {nome}" (nome preenchido na Conta) e os 5 últimos lançamentos com "Ver todos". |
| Q33 | Lançamento rápido: onde | No topo do Resumo e da tela do "+", sempre com prévia e confirmação antes de salvar. |
| Q34 | Lançamento rápido: regras | Valor = número do texto ("32", "32,50", "1.234,56"); receita por palavras ("recebi", "salário", "pix recebido"); "ontem"/"anteontem"; categoria pelo histórico do usuário primeiro, depois por dicionário de palavras. |
| Q35 | Recorrentes | Aparecem como "previsto" na lista e nos totais; o usuário confirma com um toque (pode ajustar o valor). |
| Q36 | Frequência | Só mensal (dia do mês), com data de término opcional. |
| Q37 | Metas | Dinheiro guardado é um terceiro tipo de movimento ("Guardado"), não despesa. Meta tem nome, valor-alvo, prazo opcional e progresso. |
| — | Metas: decisões de implementação | "Guardado" é o tipo `saving` em `transactions`, sempre com meta e nunca com categoria. Sai do saldo e do "Disponível para gastar", mas não conta como despesa nem no orçamento. Apagar a meta apaga o que foi guardado nela, com aviso. Com prazo, o app sugere quanto guardar por mês. No celular, Metas ocupa a vaga de Categorias na barra inferior; Categorias abre pela Conta e pelo Orçamento (no PC continua no menu). Resgatar dinheiro de uma meta fica para depois. |
| Q38 | Gráficos | Gráfico do mês por categoria no Resumo e tela de Relatórios com evolução de 6 meses. |
| — | Gráficos: decisões de implementação | Feito junto com a passada visual da referência. Resumo: rosca "Gastos do mês" (substitui a lista "Outros gastos"; cada item da legenda abre os lançamentos da categoria). Tela Relatórios: médias do período, colunas dos 6 meses com abas Saldo/Receitas/Despesas, tabela mês a mês e rosca "Para onde foi o dinheiro". Cor e ícone por categoria derivados do nome e da ordem de criação, sem coluna nova no banco (escolher cor e ícone manualmente fica para depois). No PC, Resumo e Relatórios em duas colunas. |
| Q39 | PWA | Fora: o app não precisa ser instalável. |
| — | Visual (referência) | Adendo de 2026-10-28, depois do redesign navy + vidro: o usuário mostrou um dashboard de referência (como inspiração, "não igual"). Quer o app **com bastantes cores e autoexplicativo**: cada categoria com cor e ícone redondo próprios; card de saldo com entradas, saídas e total; gráfico de barras com abas (Saldo, Receitas, Despesas); rosca de categorias com porcentagem; maiores lançamentos; lista de transações com o ícone da categoria; no PC, várias colunas (menu, painel e transações lado a lado). Fica para uma passada visual mais à frente, junto com os gráficos (item 5). |
| — | Visual | O visual minimalista da v1 ficou chapado ("bloco azul de fundo"). A v2 começa por um redesign com profundidade, componentes animados e as skills de design (UI UX Pro Max, Motion, 21st.dev), mantendo o tom sério. |

## v3: decisões

v2 concluída em 2026-10-28 (itens 1 a 5, PRs #7 a #11).

| # | Tema | Decisão |
|---|------|---------|
| Q40 | Escopo da v3 | Todas as candidatas: contas e saldo total; cartão de crédito, faturas e parcelas; exportação; assistente de IA; compartilhamento familiar; Open Finance; investimentos. |
| Q41 | Ordem | Contas → Cartão → Exportação primeiro (cartão depende de contas: pagar fatura sai de uma conta). Ordem do resto na Q44. |
| Q42 | Pendências da v2 | Viram a fatia 0 da v3: resgatar dinheiro de meta, escolher cor e ícone da categoria, "guardei 100 viagem" no lançamento rápido, apagar o índice duplicado. |
| Q43 | Ritmo | O mesmo da v2: uma fatia por PR, SQL rodado pelo usuário, teste na conta de teste antes do merge. |
| Q44 | Ordem completa | 0 pendências → Contas → Cartão → Exportação → IA → Investimentos → Compartilhamento → Open Finance (por último: depende de contratar agregador pago; preços e decisão quando chegar lá). |
| Q45 | Resgate de meta | Tirar dinheiro de uma meta é o tipo "Resgate": volta para o "Disponível para gastar" do mês do resgate e diminui a meta. Aparece em dourado com "+". Não pode passar do que está guardado na meta. |
| Q46 | Cor e ícone manuais | Editar categoria tem seletor de 8 cores e ícones; sem escolha, continua automático (nome e ordem de criação). Duas colunas novas em `categories`. |
| Q48 | Tipos de conta | Nome, tipo (Carteira, Conta corrente, Poupança, Outra), saldo inicial e cor opcional; ícone pelo tipo. Cartão de crédito vira tipo próprio na fatia seguinte. |
| Q49 | Lançamentos existentes | Cada pessoa ganha uma conta "Carteira" (padrão) e todos os lançamentos atuais vão para ela. Contas novas no app já começam com a Carteira. |
| Q50 | Conta obrigatória | Todo lançamento tem conta (menos guardado e resgate, Q53). Uma conta é a padrão, já escolhida no formulário e no lançamento rápido; o nome da conta no texto ("uber 18 nubank") escolhe a conta. |
| Q51 | Saldo da conta | Saldo inicial + entradas − saídas, de todos os meses. |
| Q52 | Transferência | Tipo próprio entre duas contas: não é receita nem despesa, não mexe no "Disponível para gastar"; só muda os saldos. Na lista: "Corrente → Poupança", neutra. |
| Q53 | Meta e contas | Guardado em meta é reserva: o dinheiro fica na conta, o saldo não muda. O Resumo mostra "Saldo em contas, dos quais R$ Y reservados em metas". Mover de verdade é transferência. |
| Q54 | Nome da aba | A aba de configurações "Conta" vira "Perfil"; "Contas" são as bancárias (card no Resumo, menu do PC, atalho no Perfil). |
| Q55 | Recorrentes e filtro | Recorrente tem conta (começa na padrão). Transações ganha filtro por conta. |
| Q56 | Cartão como conta | Tipo de conta "Cartão de crédito" com dia de fechamento, dia de vencimento, limite opcional e cor; escolhido como qualquer conta (inclusive no lançamento rápido). |
| Q57 | Gasto no cartão | Conta no dia da compra: orçamento, "Disponível para gastar" e gráficos do mês da compra. |
| Q58 | Pagar fatura | "Pagar fatura" é uma transferência da conta escolhida para o cartão, já com o valor (pode ser parcial). Não conta como despesa de novo. Fatura "paga" quando os pagamentos cobrem o total (na ordem das faturas). |
| Q59 | Fatura | Período: do dia seguinte ao fechamento anterior até o fechamento. Vencimento no mês seguinte quando o dia de vencimento ≤ dia de fechamento. Tela do cartão com faturas aberta, fechadas e pagas, navegando entre meses. |
| Q60 | Parcelamento | "R$ 300 em 3x" cria 3 lançamentos de R$ 100, um por fatura, mostrados como "(1/3)". Centavos que sobram vão na primeira. Lançamento rápido entende "tênis 300 em 3x nubank". Apagar parcela pergunta: só esta ou a compra toda. |
| Q61 | Cartão e saldo | Cartão fica fora do "Saldo em contas"; ao lado, "Faturas a pagar". Cada cartão mostra a fatura atual e o limite disponível. |
| Q62 | Formato da exportação | CSV no padrão do Excel em português: UTF-8 com BOM, ";" entre colunas, vírgula nos centavos, data dd/mm/aaaa. .xlsx fica para depois, se fizer falta. |
| Q63 | Onde exportar | Botão "Exportar" na tela de Transações e "Exportar meus dados" no Perfil; os dois abrem a mesma janela. |
| Q64 | Período | Atalhos Este mês, Mês passado, Este ano, Tudo e Personalizado (de/até). A janela mostra antes quantos lançamentos saem e o total de entradas e saídas. |
| Q65 | Colunas | Data, Descrição, Tipo, Categoria, Conta, Conta destino, Meta, Parcela e Valor (entradas positivas, saídas negativas; transferência sem sinal). |
| Q66 | O que entra | Todos os tipos de lançamento; filtra-se pela coluna Tipo na planilha. |
| Q67 | Backup completo | Fora por agora: só lançamentos. Backup com contas, categorias e metas (e restauração) fica para depois. |
| Q68 | Nome do arquivo | `mea-financas_AAAA-MM-DD_a_AAAA-MM-DD.csv`; em "Tudo", `mea-financas_tudo_<hoje>.csv`. |
| Q47 | "Guardei" no lançamento rápido | "guardei 200 viagem" vira Guardado na meta cujo nome casar; "resgatei 100 viagem" vira Resgate. Sem meta que case, a prévia pede para escolher. |

## Ambiente de desenvolvimento

Node.js, npm, Git, GitHub CLI (`gh`) e Supabase CLI instalados. Repositório: `PietroMelle/app-financeiro`.
