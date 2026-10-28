import NumberFlow from '@number-flow/react'

const FORMAT = { style: 'currency', currency: 'BRL' }

// Valor em reais com dígitos que rolam ao mudar (Number Flow; respeita "reduzir movimento").
export default function Money({ cents, signed = false, className }) {
  const negative = cents < 0
  return (
    <span className={className}>
      {signed && negative && <span aria-hidden="true">− </span>}
      <NumberFlow
        value={Math.abs(cents) / 100}
        locales="pt-BR"
        format={FORMAT}
        aria-label={`${negative ? 'menos ' : ''}${(Math.abs(cents) / 100).toLocaleString('pt-BR', FORMAT)}`}
        className="tabular-nums"
      />
    </span>
  )
}
