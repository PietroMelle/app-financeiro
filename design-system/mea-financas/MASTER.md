# MEA - Finanças: design system (Master)

> Fonte da verdade visual do app. Antes de construir uma tela, veja se existe
> `design-system/mea-financas/pages/<tela>.md`; se existir, as regras dela
> prevalecem sobre este arquivo.

Ponto de partida: UI UX Pro Max (`--design-system`, 2026-10-28, consulta
"personal finance budget tracker fintech mobile calm trustworthy", dials
variance 3, motion 5, density 5). Ajustado às decisões da [spec](../../docs/spec.md):
app (não landing page), tema seguindo o sistema, Motion em vez de GSAP.

## Estilo

**Minimalismo / Swiss.** Limpo, funcional, muito respiro, alto contraste,
hierarquia por tamanho e peso (não por cor). Uma ação primária por tela.

## Cores

Tokens semânticos em `src/index.css`. Componentes nunca usam hex direto.
Tema segue `prefers-color-scheme`. Contraste verificado (texto ≥ 4.5:1,
bordas de controle ≥ 3:1).

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `background` | `#F8FAFC` | `#0F172A` | Fundo da página (nunca branco puro) |
| `foreground` | `#0F172A` | `#F1F5F9` | Texto principal |
| `card` | `#FFFFFF` | `#1E293B` | Superfícies |
| `muted` | `#F1F5F9` | `#162032` | Fundos secundários |
| `muted-foreground` | `#475569` | `#94A3B8` | Texto secundário |
| `border` | `#E2E8F0` | `#334155` | Divisórias e cards (decorativo) |
| `input` | `#64748B` | `#64748B` | Borda de campos (≥ 3:1) |
| `primary` | `#1D4ED8` | `#2563EB` | Botão principal, foco, seleção |
| `primary-foreground` | `#FFFFFF` | `#FFFFFF` | Texto sobre primary |
| `link` | `#1D4ED8` | `#60A5FA` | Texto em azul |
| `income` | `#047857` | `#34D399` | Receitas |
| `expense` | `#B91C1C` | `#F87171` | Despesas |
| `warning` | `#B45309` | `#FBBF24` | Orçamento 80–100% (Q20) |
| `destructive` | `#B91C1C` | `#DC2626` | Ações de apagar |
| `ring` | `#1D4ED8` | `#60A5FA` | Anel de foco |

Cor nunca é o único sinal: receita e despesa também levam sinal (+/−) ou ícone.

## Tipografia

- **IBM Plex Sans** (variável, self-hosted via `@fontsource-variable/ibm-plex-sans`).
- Escala: 12 / 14 / 16 / 18 / 24 / 32. Corpo 16px, line-height 1.5.
- Pesos: 400 corpo, 500 rótulos, 600 títulos.
- Valores em dinheiro: `tabular-nums` sempre.

## Espaçamento e forma

- Ritmo de 4/8px (escala do Tailwind).
- Raio: 8px controles, 12px cards, 16px sheets/modais.
- Sombras discretas, só para elevar (sheets, menus).
- Alvos de toque ≥ 44×44px; inputs com altura ≥ 44px e fonte 16px.

## Ícones

**Lucide** (`lucide-react`), traço 2px, tamanhos 16/20/24. Sem emoji.
Ícones ao lado de texto: `aria-hidden`. Botão só de ícone: `aria-label`.

## Movimento (Motion)

- Biblioteca: `motion/react`. Só `transform` e `opacity`.
- Molas para entrada e feedback; saída ~60–70% da duração de entrada.
- Listas: entrada em stagger de 30–50ms por item, sem overshoot em listas de dados.
- Pressionar: escala 0.97, sem deslocar layout.
- No máximo 1–2 elementos animados por vista.
- `prefers-reduced-motion`: sem deslocamentos, só fades curtos ou nada.

## Componentes

shadcn/ui em JavaScript (`components.json`, `tsx: false`) sobre Radix.
Componentes do 21st.dev entram como base e são adaptados a estes tokens.

## Navegação

- Celular: barra inferior com as 3 telas principais (Resumo, Transações,
  Categorias), rótulo + ícone, item ativo destacado, botão "+" para lançar.
- PC (≥ 1024px): menu lateral com o mesmo conteúdo.
- Cada tela tem URL própria.

## Proibido

- Branco puro como fundo de página; hex direto em componentes.
- Emoji como ícone; ícone sem nome acessível.
- Hover que desloca layout; animar width/height/top/left.
- Placeholder como único rótulo; foco invisível.
- Erro só no topo do formulário; apagar sem confirmação.

## Checklist de entrega

- [ ] Contraste conferido nos dois temas
- [ ] Foco visível e ordem de tab coerente
- [ ] Alvos ≥ 44px; nada escondido atrás da barra inferior
- [ ] Testado em 375px e em desktop; sem scroll horizontal
- [ ] `prefers-reduced-motion` respeitado
- [ ] Estados vazio, carregando e erro em toda lista
