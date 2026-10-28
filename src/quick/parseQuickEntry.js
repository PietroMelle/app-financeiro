import { toISODate } from '@/lib/dates'
import { MAX_CENTS } from '@/lib/money'

// Lançamento rápido por texto (spec Q34), sem IA: "almoço 32", "recebi 200 ontem".

// "1.234,56" e "1.500" (milhar), "32,50" e "32.50" (decimal), "32". O R$ opcional sai junto.
const AMOUNT = /(?:r\$\s*)?(?<![\d.,])(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?![\d.,]*\d)/gi

const DAYS_AGO = { hoje: 0, ontem: 1, anteontem: 2 }
const CURRENCY = new Set(['real', 'reais', 'r$'])
const CONNECTORS = new Set(['de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'em', 'com', 'pra', 'pro', 'para', 'o', 'a', 'e'])
const INCOME = new Set(['recebi', 'recebido', 'recebida', 'salario', 'ganhei', 'rendimento', 'reembolso'])
// Palavras genéricas que não identificam o gasto: não servem para casar com o histórico.
const GENERIC = new Set(['recebi', 'recebido', 'recebida', 'ganhei', 'paguei', 'gastei', 'comprei', 'compra', 'pix', 'conta'])

// Palavra → nomes de categoria possíveis, em ordem. Só vale se o usuário tiver a categoria.
const DICTIONARY = [
  [['almoco', 'jantar', 'lanche', 'cafe', 'restaurante', 'ifood', 'pizza', 'hamburguer', 'marmita'], ['alimentacao', 'restaurante', 'lazer']],
  [['supermercado', 'feira', 'padaria', 'pao', 'acougue', 'hortifruti', 'sacolao'], ['mercado', 'alimentacao']],
  [['aluguel', 'condominio', 'luz', 'energia', 'agua', 'internet', 'gas', 'iptu'], ['moradia', 'casa']],
  [['uber', 'taxi', 'onibus', 'metro', 'gasolina', 'combustivel', 'estacionamento', 'pedagio', 'passagem'], ['transporte']],
  [['farmacia', 'remedio', 'medico', 'consulta', 'dentista', 'exame', 'academia', 'plano'], ['saude']],
  [['cinema', 'show', 'bar', 'cerveja', 'netflix', 'spotify', 'streaming', 'viagem', 'jogo', 'festa'], ['lazer']],
  [['escola', 'faculdade', 'curso', 'livro', 'mensalidade', 'material'], ['educacao']],
  [['salario', 'holerite', 'pagamento'], ['salario']],
]

export const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const wordsOf = (text) =>
  normalize(text)
    .split(/[^a-z0-9$]+/)
    .filter((w) => w.length >= 2 && !CONNECTORS.has(w))

function toCents(token) {
  const thousands = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(token)
  const decimal = thousands ? token.replaceAll('.', '').replace(',', '.') : token.replace(',', '.')
  return Math.round(Number(decimal) * 100)
}

function daysBefore(today, days) {
  return toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - days))
}

function trimConnectors(words) {
  const isConnector = (w) => CONNECTORS.has(normalize(w))
  let start = 0
  let end = words.length
  while (start < end && isConnector(words[start])) start++
  while (end > start && isConnector(words[end - 1])) end--
  return words.slice(start, end)
}

function guessCategory(words, kind, categories, history) {
  const own = categories.filter((c) => c.kind === kind)
  const exists = new Set(own.map((c) => c.id))
  const specific = new Set(words.filter((w) => w.length >= 3 && !GENERIC.has(w)))

  // 1. Histórico do usuário: o lançamento mais recente com uma palavra em comum.
  for (const t of history) {
    if (t.kind !== kind || !exists.has(t.categoryId) || !t.description) continue
    if (wordsOf(t.description).some((w) => specific.has(w))) return t.categoryId
  }

  // 2. O próprio nome da categoria no texto ("mercado 184").
  const byName = new Map(own.map((c) => [normalize(c.name), c.id]))
  const named = own.find((c) => wordsOf(c.name).every((w) => specific.has(w)))
  if (named) return named.id

  // 3. Dicionário de palavras.
  for (const [keys, names] of DICTIONARY) {
    if (!keys.some((k) => specific.has(k))) continue
    const name = names.find((n) => byName.has(n))
    if (name) return byName.get(name)
  }
  return null
}

/**
 * Lê o texto e devolve um rascunho de lançamento.
 * - null: texto vazio
 * - { ok: false, reason: 'amount' }: falta um valor válido
 * - { ok: true, draft: { kind, amountCents, date, categoryId, description } }
 */
export function parseQuickEntry(text, { categories = [], history = [], today = new Date() } = {}) {
  if (!text.trim()) return null

  const amounts = [...text.matchAll(AMOUNT)]
  const last = amounts.at(-1)
  const amountCents = last ? toCents(last[1]) : 0
  if (!amountCents || amountCents > MAX_CENTS) return { ok: false, reason: 'amount' }

  const rest = text.slice(0, last.index) + ' ' + text.slice(last.index + last[0].length)
  let days = 0
  const kept = rest.split(/\s+/).filter((word) => {
    const key = normalize(word).replace(/[^a-z$]/g, '')
    if (key in DAYS_AGO) {
      days = DAYS_AGO[key]
      return false
    }
    return word !== '' && !CURRENCY.has(key)
  })
  const phrase = trimConnectors(kept).join(' ')
  const description = phrase.charAt(0).toUpperCase() + phrase.slice(1)

  const words = wordsOf(text)
  const kind = words.some((w) => INCOME.has(w)) ? 'income' : 'expense'

  return {
    ok: true,
    draft: {
      kind,
      amountCents,
      date: daysBefore(today, days),
      categoryId: guessCategory(wordsOf(description), kind, categories, history),
      description,
    },
  }
}
