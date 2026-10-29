// Dinheiro sempre em centavos inteiros no app; decimal só na fronteira com o banco (Q21).

// numeric(12, 2): até 9.999.999.999,99
export const MAX_CENTS = 999_999_999_999

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function centsFromDigits(text) {
  const digits = String(text).replace(/\D/g, '').replace(/^0+/, '')
  if (!digits) return 0
  if (digits.length > String(MAX_CENTS).length) return MAX_CENTS
  return Math.min(Number(digits), MAX_CENTS)
}

export function formatCents(cents) {
  return brl.format(cents / 100)
}

export function formatSignedCents(cents, kind) {
  // Receita e resgate de meta entram no disponível; transferência é neutra.
  if (kind === 'transfer') return formatCents(Math.abs(cents))
  return `${kind === 'income' || kind === 'withdrawal' ? '+' : '−'} ${formatCents(Math.abs(cents))}`
}

export function centsToDecimal(cents) {
  const whole = Math.floor(cents / 100)
  const frac = String(cents % 100).padStart(2, '0')
  return `${whole}.${frac}`
}

// Lê pelo texto para não depender de ponto flutuante (0.29 * 100 = 28.999…).
export function decimalToCents(value) {
  // Saldo de conta pode ser negativo: o sinal vale para a parte inteira e os centavos.
  if (String(value).startsWith('-')) return -decimalToCents(String(value).slice(1))
  const [whole, frac = ''] = String(value).split('.')
  const padded = (frac + '000').slice(0, 3)
  const cents = Number(whole) * 100 + Number(padded.slice(0, 2))
  return Number(padded[2]) >= 5 ? cents + 1 : cents
}
