import { describe, expect, it } from 'vitest'
import { authErrorMessage, isExistingUserSignUp } from './authErrors'

describe('authErrorMessage', () => {
  it('retorna null sem erro', () => {
    expect(authErrorMessage(null)).toBeNull()
  })

  it('traduz códigos conhecidos', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toBe('E-mail ou senha incorretos.')
    expect(authErrorMessage({ code: 'weak_password' })).toMatch(/6 caracteres/)
  })

  it('reconhece falha de rede', () => {
    expect(authErrorMessage({ name: 'AuthRetryableFetchError' })).toMatch(/conexão/)
    expect(authErrorMessage(new TypeError('Failed to fetch'))).toMatch(/conexão/)
  })

  it('usa mensagem genérica para código desconhecido', () => {
    expect(authErrorMessage({ code: 'algo_novo', message: 'raw english' })).toBe(
      'Não foi possível concluir. Tente de novo.',
    )
  })
})

describe('isExistingUserSignUp', () => {
  it('detecta cadastro de e-mail já existente', () => {
    expect(isExistingUserSignUp({ user: { identities: [] } })).toBe(true)
  })

  it('não acusa cadastro novo', () => {
    expect(isExistingUserSignUp({ user: { identities: [{ id: '1' }] } })).toBe(false)
    expect(isExistingUserSignUp({ user: null })).toBe(false)
  })
})
