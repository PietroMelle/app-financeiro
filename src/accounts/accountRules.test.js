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
    expect(validateAccount({ name: 'X', type: 'credit' }, accounts).type).toBeTruthy()
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
