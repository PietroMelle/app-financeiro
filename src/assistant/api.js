import { supabase } from '@/lib/supabase'
import { todaySaoPaulo } from './assistantRules'

// Erro com o código que a função devolve (limit, busy, too_long...) ou "network".
async function failure(error) {
  let code = 'network'
  try {
    const body = await error.context.json()
    if (body?.error) code = body.error
  } catch {
    // Sem corpo JSON: falha de rede ou da própria plataforma.
  }
  return Object.assign(new Error(code), { code })
}

// messages: o histórico exatamente como veio da última resposta; content: a mensagem nova.
export async function ask(messages, content) {
  const { data, error } = await supabase.functions.invoke('assistant', { body: { messages, content } })
  if (error) throw await failure(error)
  if (data.refusal) throw Object.assign(new Error('refusal'), { code: 'refusal', used: data.used })
  return data
}

export async function usedToday() {
  const { data, error } = await supabase.from('ai_usage').select('messages').eq('day', todaySaoPaulo()).maybeSingle()
  if (error) throw error
  return data?.messages ?? 0
}
