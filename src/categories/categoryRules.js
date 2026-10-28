const MAX_NAME = 50
const DUPLICATE = 'Já existe uma categoria com esse nome.'

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

export function normalizeName(name) {
  return name.trim().replace(/\s+/g, ' ')
}

// Espelha as regras do banco: nome de 1 a 50 caracteres, único por usuário
// independente do tipo e sem diferenciar maiúsculas (categories_user_name_key).
export function validateCategoryName(name, existing, { ignoreId } = {}) {
  const normalized = normalizeName(name)
  if (!normalized) return 'Dê um nome à categoria.'
  if (normalized.length > MAX_NAME) return `Use no máximo ${MAX_NAME} caracteres.`
  const key = normalized.toLocaleLowerCase('pt-BR')
  const taken = existing.some((c) => c.id !== ignoreId && c.name.toLocaleLowerCase('pt-BR') === key)
  return taken ? DUPLICATE : null
}

export function sortByName(categories) {
  return [...categories].sort((a, b) => collator.compare(a.name, b.name))
}

export function categoryErrorMessage(error, action = 'salvar') {
  if (error?.code === '23505') return DUPLICATE
  if (error?.code === '23514') return 'Nome inválido.'
  if (error instanceof TypeError) return 'Sem conexão com o servidor. Verifique sua internet.'
  return `Não foi possível ${action}. Tente de novo.`
}
