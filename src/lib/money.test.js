import { describe, expect, it } from 'vitest'
import { centsFromDigits, centsToDecimal, decimalToCents, formatCents, formatSignedCents } from './money'

// Intl usa espaço não separável entre "R$" e o número.
const norm = (s) => s.replace(/\s/g, ' ')

describe('centsFromDigits', () => {
  it('lê os dígitos como centavos, estilo app de banco', () => {
    expect(centsFromDigits('1250')).toBe(1250)
    expect(centsFromDigits('5')).toBe(5)
  })

  it('ignora tudo que não é dígito', () => {
    expect(centsFromDigits('R$ 1.234,56')).toBe(123456)
  })

  it('vazio é zero', () => {
    expect(centsFromDigits('')).toBe(0)
  })

  it('limita ao máximo do banco (numeric 12,2)', () => {
    expect(centsFromDigits('9'.repeat(15))).toBe(9_999_999_999_99)
  })
})

describe('formatCents', () => {
  it('formata em reais', () => {
    expect(norm(formatCents(1250))).toBe('R$ 12,50')
    expect(norm(formatCents(123456789))).toBe('R$ 1.234.567,89')
    expect(norm(formatCents(0))).toBe('R$ 0,00')
  })
})

describe('formatSignedCents', () => {
  it('mostra sinal de receita e despesa', () => {
    expect(norm(formatSignedCents(1250, 'income'))).toBe('+ R$ 12,50')
    expect(norm(formatSignedCents(1250, 'expense'))).toBe('− R$ 12,50')
  })
})

describe('conversão com o banco', () => {
  it('envia decimal como texto exato', () => {
    expect(centsToDecimal(1250)).toBe('12.50')
    expect(centsToDecimal(5)).toBe('0.05')
    expect(centsToDecimal(123456789)).toBe('1234567.89')
  })

  it('lê numeric do banco sem erro de ponto flutuante', () => {
    expect(decimalToCents(12.5)).toBe(1250)
    expect(decimalToCents('0.29')).toBe(29)
    expect(decimalToCents(1.005)).toBe(101)
    expect(decimalToCents('1234567.89')).toBe(123456789)
  })

  it('lê valor negativo (saldo de conta, Q51)', () => {
    expect(decimalToCents('-25.50')).toBe(-2550)
    expect(decimalToCents(-0.29)).toBe(-29)
  })

  it('transferência não leva sinal', () => {
    expect(norm(formatSignedCents(5000, 'transfer'))).toBe('R$ 50,00')
  })
})
