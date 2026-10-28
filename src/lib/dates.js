// Datas de lançamento são "AAAA-MM-DD" sem fuso; mês é { year, month } com month de 1 a 12.

const pad = (n) => String(n).padStart(2, '0')

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function currentMonth(today = new Date()) {
  return { year: today.getFullYear(), month: today.getMonth() + 1 }
}

export function monthOf(isoDate) {
  const [year, month] = isoDate.split('-').map(Number)
  return { year, month }
}

export function monthKey({ year, month }) {
  return `${year}-${pad(month)}`
}

export function parseMonthKey(key) {
  const match = /^(\d{4})-(\d{2})$/.exec(key ?? '')
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  return month >= 1 && month <= 12 ? { year, month } : null
}

export function monthRange({ year, month }) {
  const lastDay = new Date(year, month, 0).getDate()
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(lastDay)}` }
}

export function addMonths({ year, month }, delta) {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
export function monthLabel({ year, month }) {
  return capitalize(monthFormat.format(new Date(year, month - 1, 1)))
}

const weekdayFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' })
const dayFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' })

export function dayLabel(isoDate, today = new Date()) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const todayISO = toISODate(today)
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (isoDate === todayISO) return 'Hoje'
  if (isoDate === toISODate(yesterday)) return 'Ontem'
  const weekday = capitalize(weekdayFormat.format(date).replace('-feira', ''))
  return `${weekday}, ${dayFormat.format(date)}`
}
