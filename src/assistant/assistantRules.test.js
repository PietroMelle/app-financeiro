import { describe, expect, it } from 'vitest'
import { displayTurns, parseReply, proposalDraft, todaySaoPaulo } from './assistantRules'

describe('displayTurns', () => {
  const history = [
    {
      role: 'user',
      content: [
        { type: 'text', text: '<contexto>\nHoje: 2026-10-28\n</contexto>' },
        { type: 'text', text: 'paguei 80 de luz' },
      ],
    },
    {
      role: 'assistant',
      content: [
        { type: 'thinking', thinking: '', signature: 'x' },
        { type: 'tool_use', id: 'tu_1', name: 'propor_lancamento', input: {} },
      ],
    },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu_1', content: 'ok' }] },
    { role: 'assistant', content: [{ type: 'text', text: 'Preparei o lançamento de **R$ 80,00**.' }] },
    { role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAA' } }] },
  ]

  it('tira o contexto, pula resultados de ferramenta e junta as rodadas numa resposta', () => {
    expect(displayTurns(history)).toEqual([
      { role: 'user', text: 'paguei 80 de luz', image: null },
      { role: 'assistant', text: 'Preparei o lançamento de **R$ 80,00**.', proposalIds: ['tu_1'] },
      { role: 'user', text: '', image: 'data:image/jpeg;base64,AAA' },
    ])
  })

  it('aceita conteúdo em texto simples', () => {
    expect(displayTurns([{ role: 'assistant', content: 'oi' }])).toEqual([{ role: 'assistant', text: 'oi', proposalIds: [] }])
  })
})

describe('parseReply', () => {
  it('separa parágrafos e listas e marca o negrito', () => {
    expect(parseReply('Em outubro:\n- Mercado: **R$ 742,50**\n- Uber: R$ 120,00\n\nTudo certo.')).toEqual([
      { type: 'paragraph', lines: [[{ text: 'Em outubro:' }]] },
      {
        type: 'list',
        items: [
          [{ text: 'Mercado: ' }, { bold: true, text: 'R$ 742,50' }],
          [{ text: 'Uber: R$ 120,00' }],
        ],
      },
      { type: 'paragraph', lines: [[{ text: 'Tudo certo.' }]] },
    ])
  })

  it('linhas seguidas ficam no mesmo parágrafo; linha em branco abre outro', () => {
    expect(parseReply('a\nb\n\nc').map((b) => b.lines.length)).toEqual([2, 1])
  })
})

describe('proposalDraft', () => {
  it('vira o rascunho do formulário, com parcelas só quando há', () => {
    const p = { kind: 'expense', amountCents: 30000, date: '2026-10-28', description: 'Tênis', categoryId: 2, accountId: 9, goalId: null, installments: 3 }
    expect(proposalDraft(p)).toEqual({ ...p, toAccountId: null, installments: 3 })
    expect(proposalDraft({ ...p, installments: null })).not.toHaveProperty('installments')
  })
})

describe('todaySaoPaulo', () => {
  it('usa a data de Brasília (01:00 UTC ainda é o dia anterior)', () => {
    expect(todaySaoPaulo(new Date('2026-10-29T01:00:00Z'))).toBe('2026-10-28')
  })
})
