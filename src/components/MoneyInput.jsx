import { centsFromDigits, formatCents } from '@/lib/money'

// Estilo app de banco: cada dígito entra pela direita (1, 2, 5, 0 -> R$ 12,50).
export default function MoneyInput({ cents, onChange, ...props }) {
  const keepCaretAtEnd = (event) => {
    const el = event.currentTarget
    const end = el.value.length
    if (el.selectionStart !== end || el.selectionEnd !== end) el.setSelectionRange(end, end)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      {...props}
      value={formatCents(cents)}
      onChange={(e) => onChange(centsFromDigits(e.target.value))}
      onFocus={keepCaretAtEnd}
      onSelect={keepCaretAtEnd}
    />
  )
}
