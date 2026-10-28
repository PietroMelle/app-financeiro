import { describe, expect, it } from 'vitest'
import {
  categoryErrorMessage,
  normalizeName,
  sortByName,
  validateCategoryName,
} from './categoryRules'

const existing = [
  { id: 1, name: 'Mercado', kind: 'expense' },
  { id: 2, name: 'Salário', kind: 'income' },
]

describe('normalizeName', () => {
  it('remove espaços extras', () => {
    expect(normalizeName('  Pet   shop ')).toBe('Pet shop')
  })
})

describe('validateCategoryName', () => {
  it('aceita nome novo', () => {
    expect(validateCategoryName('Pet', existing)).toBeNull()
  })

  it('exige nome', () => {
    expect(validateCategoryName('   ', existing)).toBe('Dê um nome à categoria.')
  })

  it('limita a 50 caracteres', () => {
    expect(validateCategoryName('a'.repeat(51), existing)).toBe('Use no máximo 50 caracteres.')
    expect(validateCategoryName('a'.repeat(50), existing)).toBeNull()
  })

  it('recusa nome repetido sem diferenciar maiúsculas, espaços ou tipo', () => {
    expect(validateCategoryName(' mercado ', existing)).toBe('Já existe uma categoria com esse nome.')
    expect(validateCategoryName('SALÁRIO', existing)).toBe('Já existe uma categoria com esse nome.')
  })

  it('permite manter o próprio nome ao renomear', () => {
    expect(validateCategoryName('Mercado', existing, { ignoreId: 1 })).toBeNull()
  })
})

describe('sortByName', () => {
  it('ordena em pt-BR sem diferenciar acentos e maiúsculas', () => {
    const sorted = sortByName([{ name: 'saúde' }, { name: 'Educação' }, { name: 'Lazer' }, { name: 'Água' }])
    expect(sorted.map((c) => c.name)).toEqual(['Água', 'Educação', 'Lazer', 'saúde'])
  })

  it('não altera a lista original', () => {
    const list = [{ name: 'b' }, { name: 'a' }]
    sortByName(list)
    expect(list[0].name).toBe('b')
  })
})

describe('categoryErrorMessage', () => {
  it('traduz nome duplicado do banco', () => {
    expect(categoryErrorMessage({ code: '23505' })).toBe('Já existe uma categoria com esse nome.')
  })

  it('traduz falha de rede', () => {
    expect(categoryErrorMessage(new TypeError('Failed to fetch'))).toMatch(/conexão/)
  })

  it('usa mensagem genérica no resto', () => {
    expect(categoryErrorMessage({ code: 'XX000' })).toBe('Não foi possível salvar. Tente de novo.')
    expect(categoryErrorMessage({ code: 'XX000' }, 'apagar')).toBe('Não foi possível apagar. Tente de novo.')
  })
})
