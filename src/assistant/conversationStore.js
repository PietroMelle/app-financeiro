import { useSyncExternalStore } from 'react'

// A conversa fica só na memória do aparelho (Q74): sobrevive à troca de tela (ir ao formulário
// pelo "Editar" e voltar), mas some ao recarregar ou ao começar uma nova.
const empty = () => ({ messages: [], proposals: {}, saved: {} })

let state = empty()
const listeners = new Set()

function set(next) {
  state = { ...state, ...next }
  for (const listener of listeners) listener()
}

export const conversation = {
  get: () => state,
  // Resposta nova: o histórico é trocado pelo que a função devolveu (o anterior + este turno).
  answered: (messages, proposals) =>
    set({ messages, proposals: { ...state.proposals, ...Object.fromEntries(proposals.map((p) => [p.id, p])) } }),
  markSaved: (id) => set({ saved: { ...state.saved, [id]: true } }),
  reset: () => set(empty()),
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useConversation() {
  return useSyncExternalStore(subscribe, conversation.get)
}
