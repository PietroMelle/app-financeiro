import { describe, expect, it } from 'vitest'
import { accountErrorMessage, defaultAccount, totalBalance, validateAccount } from './accountRules'

const accounts = [
  { id: 1, name: 'Carteira', type: 'wallet', isDefault: false },
  { id: 2, name: 'Nubank', type: 'checking', isDefault: true },
]

describe('validateAccount', () => {
  it('aceita nome e tipo', () => {
    expect(validateAccount({ name: 'Poupança', type: 'savings' }, accounts)).toEqual({})
  })

  it('exige nome de até 40 caracteres', () => {
    expect(validateAccount({ name: '  ', type: 'wallet' }, accounts).name).toBeTruthy()
    expect(validateAccount({ name: 'x'.repeat(41), type: 'wallet' }, accounts).name).toBeTruthy()
  })

  it('não repete nome, ignorando maiúsculas e espaços', () => {
    expect(validateAccount({ name: ' nubank ', type: 'checking' }, accounts).name).toBe('Já existe uma conta com esse nome.')
  })

  it('ao editar, o próprio nome pode ficar', () => {
    expect(validateAccount({ name: 'Nubank', type: 'checking' }, accounts, { ignoreId: 2 })).toEqual({})
  })

  it('tipo precisa ser conhecido', () => {
    expect(validateAccount({ name: 'X', type: 'crypto' }, accounts).type).toBeTruthy()
  })
})

describe('validateAccount: cartão (Q56)', () => {
  const card = { name: 'Nubank roxinho', type: 'credit', closingDay: 5, dueDay: 12 }

  it('cartão exige dia de fechamento e de vencimento entre 1 e 31', () => {
    expect(validateAccount(card, accounts)).toEqual({})
    expect(validateAccount({ ...card, closingDay: null }, accounts).closingDay).toBeTruthy()
    expect(validateAccount({ ...card, dueDay: 32 }, accounts).dueDay).toBeTruthy()
  })

  it('conta comum não pede esses dias', () => {
    expect(validateAccount({ name: 'Itaú', type: 'checking', closingDay: null }, accounts)).toEqual({})
  })
})

describe('totalBalance sem cartões (Q61)', () => {
  it('ignora as contas que forem cartão', () => {
    const list = [{ id: 1, type: 'checking' }, { id: 2, type: 'credit' }]
    expect(totalBalance(new Map([[1, 10000], [2, -4000]]), list)).toBe(10000)
  })
})

describe('defaultAccount', () => {
  it('é a marcada como padrão', () => {
    expect(defaultAccount(accounts).id).toBe(2)
  })

  it('sem padrão marcada, usa a primeira criada', () => {
    expect(defaultAccount([{ id: 5, isDefault: false }, { id: 3, isDefault: false }]).id).toBe(3)
  })

  it('sem contas, não há padrão', () => {
    expect(defaultAccount([])).toBeNull()
  })
})

describe('totalBalance', () => {
  it('soma o saldo de todas as contas, inclusive negativo', () => {
    expect(totalBalance(new Map([[1, 10000], [2, -2500]]))).toBe(7500)
  })
})

describe('accountErrorMessage', () => {
  it('explica nome repetido e conta com lançamentos', () => {
    expect(accountErrorMessage({ code: '23505' })).toBe('Já existe uma conta com esse nome.')
    expect(accountErrorMessage({ code: '23503' }, 'apagar')).toMatch(/lançamentos/)
  })
})
