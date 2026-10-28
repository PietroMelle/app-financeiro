// Traduz erros do Supabase Auth para mensagens em pt-BR (spec Q13).
const MESSAGES = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.',
  user_already_exists: 'Já existe uma conta com este e-mail.',
  email_exists: 'Já existe uma conta com este e-mail.',
  weak_password: 'Senha fraca. Use pelo menos 6 caracteres.',
  email_address_invalid: 'E-mail inválido.',
  validation_failed: 'Confira o e-mail e a senha.',
  over_email_send_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  signup_disabled: 'Novos cadastros estão desativados.',
}

const FALLBACK = 'Não foi possível concluir. Tente de novo.'
const NETWORK = 'Sem conexão com o servidor. Verifique sua internet.'

export function authErrorMessage(error) {
  if (!error) return null
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]
  if (error.name === 'AuthRetryableFetchError' || error instanceof TypeError) return NETWORK
  return FALLBACK
}

// Com confirmação de e-mail ligada, o Supabase não devolve erro para e-mail já
// cadastrado: devolve um usuário sem identidades.
export function isExistingUserSignUp(data) {
  return Array.isArray(data?.user?.identities) && data.user.identities.length === 0
}
