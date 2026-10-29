import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { formatCents } from '@/lib/money'
import { useElementWidth } from '@/lib/useElementWidth'
import { niceTicks } from './reportRules'

const PLOT_H = 180
const AXIS_H = 28
const LEFT = 56 // espaço das marcas do eixo Y
const MAX_BAR = 24 // dataviz: coluna fina, nunca enche a faixa
const RADIUS = 4

const compact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const tickLabel = (cents) => compact.format(cents / 100)

// Coluna com ponta arredondada (4px) e base reta, crescendo da linha do zero.
function columnPath(x, w, y0, y1) {
  const h = Math.abs(y1 - y0)
  const r = Math.min(RADIUS, h, w / 2)
  if (h === 0) return ''
  if (y1 < y0) {
    return `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + w - r} Q${x + w},${y1} ${x + w},${y1 + r} V${y0} Z`
  }
  return `M${x},${y0} V${y1 - r} Q${x},${y1} ${x + r},${y1} H${x + w - r} Q${x + w},${y1} ${x + w},${y1 - r} V${y0} Z`
}

// Uma série só (o título diz qual): sem caixa de legenda. Valor direto só no mês destacado;
// os outros ficam no eixo, no toque/hover e na tabela da página.
export default function ColumnChart({ data, color, highlightKey, label }) {
  const id = useId()
  const [ref, width] = useElementWidth()
  const [active, setActive] = useState(null)

  const values = data.map((d) => d.value)
  const ticks = niceTicks(Math.min(...values), Math.max(...values))
  const min = ticks[0]
  const max = ticks.at(-1)
  const y = (v) => PLOT_H - ((v - min) / (max - min)) * PLOT_H
  const plotW = Math.max(width - LEFT, 0)
  const band = data.length ? plotW / data.length : 0
  const barW = Math.min(MAX_BAR, band * 0.55)
  const zero = y(0)
  const shown = data.find((d) => d.key === active)
  const shownIndex = data.findIndex((d) => d.key === active)

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg width={width} height={PLOT_H + AXIS_H} role="img" aria-labelledby={`${id}-desc`} className="overflow-visible">
          <desc id={`${id}-desc`}>
            {label}: {data.map((d) => `${d.label} ${formatCents(d.value)}`).join(', ')}
          </desc>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={LEFT}
                x2={width}
                y1={y(t)}
                y2={y(t)}
                strokeWidth={1}
                className={t === 0 ? 'stroke-muted-foreground/50' : 'stroke-border'}
              />
              <text
                x={LEFT - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[11px] tabular-nums"
              >
                {tickLabel(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const x = LEFT + i * band + (band - barW) / 2
            const isHighlight = d.key === highlightKey
            const dim = active !== null ? active !== d.key : !isHighlight
            return (
              <g key={d.key}>
                <motion.path
                  d={columnPath(x, barW, zero, y(d.value))}
                  style={{ fill: color, transformBox: 'fill-box', transformOrigin: d.value >= 0 ? 'bottom' : 'top' }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1, opacity: dim ? 0.55 : 1 }}
                  transition={{ type: 'spring', bounce: 0, visualDuration: 0.5, delay: i * 0.04 }}
                />
                {isHighlight && active === null && d.value !== 0 && (
                  <text
                    x={x + barW / 2}
                    y={d.value >= 0 ? y(d.value) - 8 : y(d.value) + 16}
                    textAnchor="middle"
                    className="fill-foreground text-xs font-semibold tabular-nums"
                  >
                    {tickLabel(d.value)}
                  </text>
                )}
                <text
                  x={x + barW / 2}
                  y={PLOT_H + 18}
                  textAnchor="middle"
                  className={isHighlight ? 'fill-foreground text-xs font-semibold' : 'fill-muted-foreground text-xs'}
                >
                  {d.label}
                </text>
                {/* Área de toque maior que a coluna: a faixa inteira do mês. */}
                <rect
                  x={LEFT + i * band}
                  y={0}
                  width={band}
                  height={PLOT_H + AXIS_H}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.label}: ${formatCents(d.value)}`}
                  onPointerEnter={() => setActive(d.key)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(d.key)}
                  onBlur={() => setActive(null)}
                  className="outline-none focus-visible:stroke-ring focus-visible:stroke-2"
                />
              </g>
            )
          })}
        </svg>
      )}

      <AnimatePresence>
        {shown && (
          <motion.div
            key={shown.key}
            role="status"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15 }}
            style={{ left: Math.min(Math.max(LEFT + shownIndex * band + band / 2, 70), width - 70) }}
            className="pointer-events-none absolute -top-2 -translate-x-1/2 -translate-y-full rounded-lg bg-popover px-3 py-2 text-center shadow-lg ring-1 ring-border"
          >
            <p className="text-xs text-muted-foreground">{shown.fullLabel ?? shown.label}</p>
            <p className="text-sm font-semibold tabular-nums">{formatCents(shown.value)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
