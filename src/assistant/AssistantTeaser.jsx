import { ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { ASSISTANT_PATH } from '@/app/navItems'

// Entrada do assistente no Resumo (Q73): no celular a barra de baixo já está cheia.
export default function AssistantTeaser() {
  return (
    <Link
      to={ASSISTANT_PATH}
      className="group relative isolate flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4c1d95] via-[#3730a3] to-[#1e40af] p-4 text-white ring-1 ring-white/10 transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:scale-[0.99]"
    >
      <span
        aria-hidden="true"
        className="absolute -top-10 right-6 -z-10 size-28 rounded-full bg-fuchsia-400/30 blur-2xl animate-aurora motion-reduce:animate-none"
      />
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Pergunte ao assistente</span>
        <span className="block truncate text-sm text-white/80">“Onde estou gastando mais este mês?”</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}
