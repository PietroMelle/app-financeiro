import { describe, expect, it } from 'vitest'
import { colorSlots, iconKeyFor } from './categoryLook'

describe('iconKeyFor', () => {
  it.each([
    ['Mercado', 'cart'],
    ['Supermercado', 'cart'],
    ['Moradia', 'home'],
    ['Aluguel', 'home'],
    ['Transporte', 'car'],
    ['Uber e 99', 'car'],
    ['Saúde', 'health'],
    ['Farmácia', 'health'],
    ['Lazer', 'fun'],
    ['Educação', 'education'],
    ['Alimentação', 'food'],
    ['Restaurantes', 'food'],
    ['Salário', 'salary'],
    ['Pets', 'pet'],
    ['Viagem', 'travel'],
    ['Assinaturas', 'subscription'],
  ])('%s → %s', (name, key) => {
    expect(iconKeyFor(name)).toBe(key)
  })

  it('"Outros" e nomes sem pista caem no ícone genérico', () => {
    expect(iconKeyFor('Outros')).toBe('other')
    expect(iconKeyFor('Coisas do João')).toBe('tag')
  })
})

describe('colorSlots', () => {
  it('dá uma cor fixa por categoria, na ordem de criação, de 1 a 8', () => {
    const slots = colorSlots([{ id: 30 }, { id: 10 }, { id: 20 }])
    expect([slots.get(10), slots.get(20), slots.get(30)]).toEqual([1, 2, 3])
  })

  it('criar uma categoria nova não muda a cor das outras', () => {
    const before = colorSlots([{ id: 1 }, { id: 2 }])
    const after = colorSlots([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(after.get(1)).toBe(before.get(1))
    expect(after.get(2)).toBe(before.get(2))
  })

  it('depois da oitava, recomeça', () => {
    const slots = colorSlots(Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })))
    expect(slots.get(9)).toBe(1)
    expect(slots.get(10)).toBe(2)
  })
})
