# MEA - Finanças: design system (Master)

> Fonte da verdade visual do app. Antes de construir uma tela, veja se existe
> `design-system/mea-financas/pages/<tela>.md`; se existir, as regras dela
> prevalecem sobre este arquivo.

**v2 (2026-10-28): "Navy + vidro + dourado", escuro como padrão.** Ponto de
partida: UI UX Pro Max (produto "Personal Finance Tracker" → Glassmorphism +
Dark Mode; paleta Banking → navy, azul de confiança, dourado). Tom da
[spec](../../docs/spec.md) Q28: plataforma completa e séria, sem mascote nem
gamificação. A v1 (minimalismo claro) foi rejeitada por ficar "um bloco azul".

## Estilo

**Vidro sobre navy.** Fundo azul-marinho profundo com um brilho "aurora" fixo e
lento (`body::before`). Superfícies são vidro fosco (`glass`): translúcidas, com
borda fina, reflexo no topo e `backdrop-filter`. Profundidade vem de camadas,
não de cor. Uma ação primária por tela.

- **Hero** (só no Resumo): card com gradiente azul profundo
  (`#1E3A8A → #1E40AF → #3730A3`), manchas de luz desfocadas animadas
  (`animate-aurora`) e o valor principal grande. Pílulas internas em `white/10`.
- **Dourado** é raro: logo e metas (v2 item 4). Nunca para texto corrido.

## Cores

Tokens semânticos em `src/index.css`. Componentes não usam hex direto (exceção
documentada: gradientes do hero, do logo e do botão "+").
Tema em `data-theme` no `<html>`: escuro por padrão, troca na Conta
(Escuro / Claro / Sistema), salvo em `localStorage` (`mea-theme`) e aplicado por
um script inline antes da primeira pintura. Contraste calculado sobre a cor
resultante atrás do vidro (texto ≥ 4.5:1, bordas de controle ≥ 3:1).

| Token | Escuro (padrão) | Claro | Uso |
|---|---|---|---|
| `background` | `#0A1628` | `#F4F6FB` | Fundo da página |
| `foreground` | `#F1F5F9` | `#0A1628` | Texto principal |
| `card` | `white / 5%` | `white / 75%` | Vidro (use a utility `glass`) |
| `card-solid` / `popover` | `#111D33` | `#FFFFFF` | Diálogos, menus |
| `muted` | `white / 6%` | `slate-900 / 5%` | Fundos secundários, hover |
| `muted-foreground` | `#94A3B8` | `#475569` | Texto secundário |
| `border` | `white / 9%` | `slate-900 / 9%` | Divisórias (decorativo) |
| `input` | `#8391A7` | `#64748B` | Borda de campos (≥ 3:1) |
| `raised` | `white / 12%` | `#FFFFFF` | Indicador de abas/segmentos |
| `primary` | `#2563EB` | `#1D4ED8` | Botão principal, seleção |
| `link` / `ring` | `#60A5FA` | `#1D4ED8` | Texto azul, anel de foco |
| `income` | `#34D399` | `#047857` | Receitas |
| `expense` | `#F87171` | `#B91C1C` | Despesas |
| `warning` | `#FBBF24` | `#B45309` | Orçamento 80–100% (Q20) |
| `gold` | `#F4C95D` | `#A16207` | Destaque raro (logo, metas) |
| `destructive` | `#DC2626` | `#B91C1C` | Ações de apagar |

Cor nunca é o único sinal: receita e despesa também levam sinal (+/−) ou ícone.
Estado selecionado (chips, Hoje/Ontem) = `bg-primary` sólido com texto branco.

## Tipografia

- **IBM Plex Sans** (variável, self-hosted via `@fontsource-variable/ibm-plex-sans`).
- Escala: 12 / 14 / 16 / 18 / 24 / 36–48 (valor do hero). Corpo 16px.
- Pesos: 400 corpo, 500 rótulos, 600 títulos e valores.
- Dinheiro: `tabular-nums` sempre; valores que mudam usam `<Money>`
  (`@number-flow/react`, dígitos rolam ao trocar de mês).

## Espaçamento e forma

- Ritmo de 4/8px (escala do Tailwind).
- Raio: 8px controles, 16px listas e cards (`rounded-2xl`), 24px hero.
- Alvos de toque ≥ 44×44px; inputs com altura ≥ 44px e fonte 16px.
- Grids de página usam `grid-cols-1` (`minmax(0,1fr)`): texto `truncate` não
  pode alargar a coluna.

## Ícones

**Lucide** (`lucide-react`), traço 2px, tamanhos 16/20/24. Sem emoji.
Ícones ao lado de texto: `aria-hidden`. Botão só de ícone: `aria-label`.

## Movimento (Motion)

- Biblioteca: `motion/react`, com `MotionConfig reducedMotion="user"`.
- Molas sem overshoot (`bounce: 0`) em dados; só `transform` e `opacity`.
- Troca de página e de mês: só entrada (fade + deslize curto). Sem
  `AnimatePresence mode="wait"` em páginas (a saída travava).
- Indicadores de aba/segmento com `layoutId`. Barras de orçamento com `scaleX`.
- Listas: stagger de 30–50ms por item. Pressionar: escala 0.94–0.97.
- Ambiente (aurora do fundo e do hero) é lento (≥ 18s) e some com
  `prefers-reduced-motion`.

## Componentes

shadcn/ui em JavaScript (`components.json`, `tsx: false`) sobre Radix.
Componentes do 21st.dev entram como base e são adaptados a estes tokens.

## Navegação

- Celular: barra inferior de vidro com Resumo, Transações, Categorias e Conta,
  e botão "+" com gradiente no centro (some no formulário de lançamento).
- PC (≥ 1024px): menu lateral de vidro com o mesmo conteúdo.
- Cada tela tem URL própria.

## Proibido

- Hex direto em componentes (fora das exceções acima).
- Emoji como ícone; ícone sem nome acessível; mascote ou gamificação.
- Hover que desloca layout; animar width/height/top/left.
- Placeholder como único rótulo; foco invisível.
- Erro só no topo do formulário; apagar sem confirmação.

## Checklist de entrega

- [ ] Contraste conferido nos dois temas (sobre o vidro, não sobre o fundo)
- [ ] Foco visível e ordem de tab coerente
- [ ] Alvos ≥ 44px; nada escondido atrás da barra inferior
- [ ] Testado em 390px e em desktop, com dados reais; sem scroll horizontal
- [ ] `prefers-reduced-motion` respeitado
- [ ] Estados vazio, carregando e erro em toda lista
