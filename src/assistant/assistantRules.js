// Assistente de IA (spec Q69 a Q77). O histórico bruto (o que a API recebe) fica intacto;
// daqui sai só o que a tela mostra.

const CONTEXT = /<contexto>[\s\S]*?<\/contexto>/g

export const PROPOSE_TOOL = 'propor_lancamento'

// Balões da conversa a partir do histórico: pergunta da pessoa e resposta do assistente
// (textos e cards de lançamento de todas as rodadas de consulta, juntos).
export function displayTurns(messages) {
  const turns = []
  for (const message of messages) {
    const blocks = typeof message.content === 'string' ? [{ type: 'text', text: message.content }] : message.content
    if (message.role === 'user') {
      // Resultados de ferramenta fazem parte da resposta, não são fala da pessoa.
      if (blocks.every((b) => b.type === 'tool_result')) continue
      const text = blocks
        .filter((b) => b.type === 'text')
        .map((b) => b.text.replace(CONTEXT, '').trim())
        .filter(Boolean)
        .join('\n')
      const image = blocks.find((b) => b.type === 'image')
      turns.push({ role: 'user', text, image: image ? `data:${image.source.media_type};base64,${image.source.data}` : null })
      continue
    }
    let turn = turns.at(-1)
    if (turn?.role !== 'assistant') {
      turn = { role: 'assistant', text: '', proposalIds: [] }
      turns.push(turn)
    }
    for (const b of blocks) {
      if (b.type === 'text' && b.text.trim()) turn.text = turn.text ? `${turn.text}\n\n${b.text.trim()}` : b.text.trim()
      if (b.type === 'tool_use' && b.name === PROPOSE_TOOL) turn.proposalIds.push(b.id)
    }
  }
  return turns
}

// Markdown mínimo da resposta: parágrafos, listas com "- " e **negrito**. Nada de HTML.
export function parseReply(text) {
  const blocks = []
  for (const line of text.split('\n')) {
    const item = /^\s*[-•*]\s+(.*)$/.exec(line)
    if (item) {
      const last = blocks.at(-1)
      if (last?.type === 'list') last.items.push(inline(item[1]))
      else blocks.push({ type: 'list', items: [inline(item[1])] })
    } else if (line.trim()) {
      const last = blocks.at(-1)
      if (last?.type === 'paragraph' && !last.closed) last.lines.push(inline(line.trim()))
      else blocks.push({ type: 'paragraph', lines: [inline(line.trim())] })
    } else if (blocks.at(-1)?.type === 'paragraph') {
      blocks.at(-1).closed = true
    }
  }
  return blocks.map(({ closed: _closed, ...b }) => b)
}

function inline(text) {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) => (part.startsWith('**') && part.endsWith('**') ? { bold: true, text: part.slice(2, -2) } : { text: part }))
}

// Rascunho para o formulário de lançamento ("Editar") e para salvar direto ("Salvar").
export function proposalDraft(p) {
  return {
    kind: p.kind,
    amountCents: p.amountCents,
    date: p.date,
    description: p.description,
    categoryId: p.categoryId,
    accountId: p.accountId,
    goalId: p.goalId,
    toAccountId: null,
    ...(p.installments && { installments: p.installments }),
  }
}

export const SUGGESTIONS = [
  { text: 'Quanto gastei este mês?', tone: 'blue' },
  { text: 'Onde estou gastando mais?', tone: 'violet' },
  { text: 'Compare este mês com o passado', tone: 'cyan' },
  { text: 'Paguei 80 de luz hoje', tone: 'emerald' },
  { text: 'Como estão minhas metas?', tone: 'amber' },
]

export function assistantErrorMessage(code) {
  if (code === 'limit') return 'Você usou as 30 mensagens de hoje. Amanhã tem mais.'
  if (code === 'busy') return 'O assistente está ocupado agora. Tente de novo em instantes.'
  if (code === 'too_long') return 'A conversa ficou longa demais. Comece uma nova conversa.'
  if (code === 'too_large') return 'A foto ficou grande demais. Tente outra.'
  if (code === 'refusal') return 'Não consegui responder a isso. Tente perguntar de outro jeito.'
  if (code === 'network') return 'Sem conexão com o servidor. Verifique sua internet.'
  return 'Não foi possível responder agora. Tente de novo.'
}

const todayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })
// O limite diário vira à meia-noite de Brasília, como no banco.
export const todaySaoPaulo = (now = new Date()) => todayFormat.format(now)
