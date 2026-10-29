import { describe, expect, it } from 'vitest'
import { parseQuickEntry } from './parseQuickEntry'

const TODAY = new Date(2026, 9, 28) // 28/10/2026

const categories = [
  { id: 1, name: 'Mercado', kind: 'expense' },
  { id: 2, name: 'Moradia', kind: 'expense' },
  { id: 3, name: 'Transporte', kind: 'expense' },
  { id: 4, name: 'Saúde', kind: 'expense' },
  { id: 5, name: 'Lazer', kind: 'expense' },
  { id: 6, name: 'Educação', kind: 'expense' },
  { id: 7, name: 'Outros', kind: 'expense' },
  { id: 8, name: 'Salário', kind: 'income' },
  { id: 9, name: 'Alimentação', kind: 'expense' },
]

const parse = (text, history = []) => parseQuickEntry(text, { categories, history, today: TODAY })

describe('parseQuickEntry: valor', () => {
  it.each([
    ['almoço 32', 3200],
    ['almoço 32,50', 3250],
    ['almoço 32.50', 3250],
    ['almoço 32,5', 3250],
    ['aluguel 1.234,56', 123456],
    ['aluguel 1.500', 150000],
    ['aluguel 1500', 150000],
    ['uber R$ 18,90', 1890],
    ['uber r$18', 1800],
    ['50 reais de gasolina', 5000],
  ])('%s → %i centavos', (text, cents) => {
    expect(parse(text).draft.amountCents).toBe(cents)
  })

  it('usa o último número quando há mais de um', () => {
    expect(parse('2 pizzas 89,90').draft.amountCents).toBe(8990)
  })

  it('sem número, pede o valor', () => {
    expect(parse('almoço')).toEqual({ ok: false, reason: 'amount' })
  })

  it('zero não é valor', () => {
    expect(parse('almoço 0')).toEqual({ ok: false, reason: 'amount' })
  })

  it('texto vazio não gera nada', () => {
    expect(parse('   ')).toBeNull()
  })
})

describe('parseQuickEntry: tipo', () => {
  it('é despesa por padrão', () => {
    expect(parse('almoço 32').draft.kind).toBe('expense')
  })

  it.each(['recebi 200 do joão', 'salário 5000', 'pix recebido 150', 'Salario 5000', 'ganhei 50'])(
    '%s é receita',
    (text) => {
      expect(parse(text).draft.kind).toBe('income')
    },
  )
})

describe('parseQuickEntry: data', () => {
  it('é hoje por padrão', () => {
    expect(parse('almoço 32').draft.date).toBe('2026-10-28')
  })

  it('entende ontem e anteontem', () => {
    expect(parse('almoço 32 ontem').draft.date).toBe('2026-10-27')
    expect(parse('anteontem mercado 100').draft.date).toBe('2026-10-26')
  })

  it('ontem atravessa o mês', () => {
    const draft = parseQuickEntry('pão 8 ontem', { categories, history: [], today: new Date(2026, 10, 1) }).draft
    expect(draft.date).toBe('2026-10-31')
  })
})

describe('parseQuickEntry: descrição', () => {
  it('tira valor, moeda e data e capitaliza', () => {
    expect(parse('almoço 32 ontem').draft.description).toBe('Almoço')
    expect(parse('uber R$ 18,90').draft.description).toBe('Uber')
  })

  it('tira conectores soltos nas pontas', () => {
    expect(parse('50 reais de gasolina').draft.description).toBe('Gasolina')
  })

  it('fica vazia quando só há valor', () => {
    expect(parse('32').draft.description).toBe('')
  })
})

describe('parseQuickEntry: categoria', () => {
  it('usa o histórico primeiro', () => {
    const history = [{ description: 'Almoço no trabalho', kind: 'expense', categoryId: 5 }]
    expect(parse('almoço 32', history).draft.categoryId).toBe(5)
  })

  it('no histórico, vale o lançamento mais recente (primeiro da lista)', () => {
    const history = [
      { description: 'Uber', kind: 'expense', categoryId: 7 },
      { description: 'Uber', kind: 'expense', categoryId: 3 },
    ]
    expect(parse('uber 20', history).draft.categoryId).toBe(7)
  })

  it('ignora histórico de outro tipo ou sem categoria', () => {
    const history = [
      { description: 'Almoço', kind: 'income', categoryId: 8 },
      { description: 'Almoço', kind: 'expense', categoryId: null },
    ]
    expect(parse('almoço 32', history).draft.categoryId).toBe(9)
  })

  it('ignora histórico com categoria que não existe mais', () => {
    const history = [{ description: 'Almoço', kind: 'expense', categoryId: 99 }]
    expect(parse('almoço 32', history).draft.categoryId).toBe(9)
  })

  it('reconhece o nome da categoria, sem acento', () => {
    expect(parse('mercado 184').draft.categoryId).toBe(1)
    expect(parse('saude 40').draft.categoryId).toBe(4)
  })

  it('cai no dicionário de palavras', () => {
    expect(parse('uber 18').draft.categoryId).toBe(3)
    expect(parse('farmácia 45').draft.categoryId).toBe(4)
    expect(parse('aluguel 1500').draft.categoryId).toBe(2)
    expect(parse('salário 5000').draft.categoryId).toBe(8)
  })

  it('dicionário só aponta para categorias que o usuário tem', () => {
    const draft = parseQuickEntry('almoço 32', { categories: categories.filter((c) => c.id !== 9), history: [], today: TODAY }).draft
    expect(draft.categoryId).toBe(5)
  })

  it('sem pista, fica sem categoria', () => {
    expect(parse('presente 80').draft.categoryId).toBeNull()
  })
})

describe('parseQuickEntry: metas (Q47)', () => {
  const goals = [
    { id: 1, name: 'Viagem para a praia' },
    { id: 2, name: 'Reserva de emergência' },
  ]
  const withGoals = (text) => parseQuickEntry(text, { categories, history: [], today: TODAY, goals })

  it('"guardei" vira guardado na meta cujo nome casar', () => {
    expect(withGoals('guardei 200 viagem').draft).toMatchObject({
      kind: 'saving',
      amountCents: 20000,
      goalId: 1,
      categoryId: null,
    })
    expect(withGoals('guardar 150 na reserva').draft.goalId).toBe(2)
    expect(withGoals('poupei 50 emergencia').draft.goalId).toBe(2)
  })

  it('"resgatei" vira resgate', () => {
    expect(withGoals('resgatei 100 da reserva ontem').draft).toMatchObject({
      kind: 'withdrawal',
      amountCents: 10000,
      goalId: 2,
      date: '2026-10-27',
    })
  })

  it('sem meta que case, fica sem meta para a pessoa escolher', () => {
    expect(withGoals('guardei 80').draft).toMatchObject({ kind: 'saving', goalId: null })
  })

  it('a descrição não repete o verbo nem o nome da meta', () => {
    expect(withGoals('guardei 200 viagem').draft.description).toBe('')
    expect(withGoals('guardei 200 viagem do bônus').draft.description).toBe('Bônus')
  })

  it('sem palavra de meta, nada muda: continua despesa', () => {
    expect(withGoals('viagem 200').draft.kind).toBe('expense')
  })
})
describe('parseQuickEntry: conta (Q50)', () => {
  const accounts = [
    { id: 1, name: 'Carteira', isDefault: true },
    { id: 2, name: 'Nubank', isDefault: false },
    { id: 3, name: 'Conta do Itaú', isDefault: false },
  ]
  const withAccounts = (text) => parseQuickEntry(text, { categories, history: [], today: TODAY, accounts })

  it('usa a conta padrão quando o texto não cita conta', () => {
    expect(withAccounts('almoço 32').draft.accountId).toBe(1)
  })

  it('o nome da conta no texto escolhe a conta e sai da descrição', () => {
    const draft = withAccounts('uber 18 nubank').draft
    expect(draft).toMatchObject({ accountId: 2, description: 'Uber' })
    expect(withAccounts('mercado 90 no itau').draft).toMatchObject({ accountId: 3, description: 'Mercado' })
  })

  it('guardado em meta não tem conta (Q53)', () => {
    const goals = [{ id: 9, name: 'Viagem' }]
    const draft = parseQuickEntry('guardei 50 viagem nubank', { categories, history: [], today: TODAY, accounts, goals }).draft
    expect(draft.accountId).toBeNull()
  })
})