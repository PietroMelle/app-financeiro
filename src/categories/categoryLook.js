import { normalize } from '@/lib/text'

// Cor e ícone de cada categoria, sem nada salvo no banco: o ícone vem do nome
// e a cor da ordem de criação (8 cores validadas para daltonismo, ver MASTER.md).

const SLOTS = 8

// Palavra no nome → ícone. A primeira regra que casar vale.
const ICON_RULES = [
  ['cart', ['mercado', 'supermercado', 'feira', 'compras']],
  ['food', ['alimentacao', 'comida', 'restaurante', 'lanche', 'ifood', 'delivery', 'padaria']],
  ['home', ['moradia', 'casa', 'aluguel', 'condominio', 'contas']],
  ['car', ['transporte', 'carro', 'uber', 'combustivel', 'gasolina', 'onibus', 'moto']],
  ['health', ['saude', 'farmacia', 'medico', 'academia', 'remedio']],
  ['education', ['educacao', 'escola', 'faculdade', 'curso', 'livros']],
  ['fun', ['lazer', 'diversao', 'cinema', 'jogos', 'festa', 'bar']],
  ['travel', ['viagem', 'viagens', 'ferias', 'passagem']],
  ['subscription', ['assinatura', 'assinaturas', 'streaming']],
  ['pet', ['pet', 'pets', 'cachorro', 'gato']],
  ['clothes', ['roupa', 'roupas', 'vestuario']],
  ['gift', ['presente', 'presentes', 'doacao']],
  ['salary', ['salario', 'pagamento', 'holerite']],
  ['freelance', ['freela', 'freelance', 'extra', 'bico']],
  ['invest', ['investimento', 'investimentos', 'rendimento', 'rendimentos', 'dividendos']],
  ['other', ['outros', 'outro', 'diversos']],
]

export function iconKeyFor(name) {
  // Plural simples também vale: "Restaurantes" casa com "restaurante".
  const words = normalize(name)
    .split(/[^a-z0-9]+/)
    .flatMap((w) => [w, w.replace(/s$/, '')])
  const match = ICON_RULES.find(([, keys]) => keys.some((k) => words.includes(k)))
  return match ? match[0] : 'tag'
}

// id → posição 1..8 pela ordem de criação (id crescente). Categoria nova vai para o fim,
// então as cores das outras não mudam.
export function colorSlots(categories) {
  const sorted = [...categories].sort((a, b) => a.id - b.id)
  return new Map(sorted.map((c, i) => [c.id, (i % SLOTS) + 1]))
}

export const slotColor = (slot) => (slot ? `var(--cat-${slot})` : 'var(--cat-none)')
