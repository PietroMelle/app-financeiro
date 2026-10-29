import { AlertCircle, ArrowUp, ImagePlus, MessageSquarePlus, Sparkles, X } from 'lucide-react'
import { motion } from 'motion/react'
import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/accounts/useAccounts'
import { useCategories } from '@/categories/useCategories'
import { useGoals } from '@/goals/useGoals'
import { cn } from '@/lib/utils'
import * as api from './api'
import { assistantErrorMessage, displayTurns, parseReply, SUGGESTIONS } from './assistantRules'
import { conversation, useConversation } from './conversationStore'
import ProposalCard from './ProposalCard'
import { resizeImage } from './resizeImage'

const LIMIT = 30

// Bolinha colorida em cada sugestão, sobre o card escuro.
const DOTS = { blue: 'bg-blue-300', violet: 'bg-violet-300', cyan: 'bg-cyan-300', emerald: 'bg-emerald-300', amber: 'bg-amber-300' }

function Avatar() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-sm">
      <Sparkles className="size-4" aria-hidden="true" />
    </span>
  )
}

function Reply({ text }) {
  return (
    <div className="grid gap-2 leading-relaxed">
      {parseReply(text).map((block, i) =>
        block.type === 'list' ? (
          <ul key={i} className="grid list-disc gap-1 pl-5 marker:text-violet-500">
            {block.items.map((parts, j) => (
              <li key={j}>
                <Inline parts={parts} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            {block.lines.map((parts, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                <Inline parts={parts} />
              </Fragment>
            ))}
          </p>
        ),
      )}
    </div>
  )
}

function Inline({ parts }) {
  return parts.map((part, i) => (part.bold ? <strong key={i} className="font-semibold">{part.text}</strong> : <Fragment key={i}>{part.text}</Fragment>))
}

function Thinking() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5" role="status">
      <Avatar />
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md glass px-4 py-3 text-sm text-muted-foreground">
        <span aria-hidden="true" className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{ animationDelay: `${i * 150}ms` }}
              className="size-1.5 animate-bounce rounded-full bg-violet-500 motion-reduce:animate-none"
            />
          ))}
        </span>
        Consultando seus dados…
      </div>
    </motion.div>
  )
}

function Welcome({ onPick }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0, visualDuration: 0.35 }}
      className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#312e81] via-[#1e3a8a] to-[#0f172a] p-6 text-white ring-1 ring-white/10"
    >
      <span
        aria-hidden="true"
        className="absolute -top-16 -right-12 -z-10 size-56 rounded-full bg-violet-400/30 blur-3xl animate-aurora motion-reduce:animate-none"
      />
      <span className="grid size-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
        <Sparkles className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">Oi! Pergunte sobre seu dinheiro</h2>
      <p className="mt-1 text-sm text-white/80">
        Eu consulto seus lançamentos, contas e metas para responder. Também lanço gastos por conversa ou pela foto de um
        recibo. Você sempre confirma antes de salvar.
      </p>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Sugestões">
        {SUGGESTIONS.map((s, i) => (
          <motion.li key={s.text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}>
            <button
              type="button"
              onClick={() => onPick(s.text)}
              className="flex min-h-11 items-center gap-2 rounded-full bg-white/12 px-4 text-sm font-medium text-white ring-1 ring-white/25 transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-white/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
            >
              <span aria-hidden="true" className={cn('size-2 rounded-full', DOTS[s.tone])} />
              {s.text}
            </button>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  )
}

function useUsage() {
  const [used, setUsed] = useState(null)
  useEffect(() => {
    api.usedToday().then(setUsed, () => setUsed(null))
  }, [])
  return [used, setUsed]
}

export default function AssistantPage() {
  const id = useId()
  const { messages, proposals, saved } = useConversation()
  const turns = useMemo(() => displayTurns(messages), [messages])
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)
  const [used, setUsed] = useUsage()
  const fileInput = useRef(null)
  const bottom = useRef(null)

  const { categories } = useCategories()
  const { accounts } = useAccounts()
  const { goals } = useGoals()
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const goalsById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length, pending])

  async function send(content) {
    setPending({ content })
    setError(null)
    try {
      const data = await api.ask(conversation.get().messages, content)
      conversation.answered(data.messages, data.proposals ?? [])
      setUsed(data.used)
      setText('')
      setImage(null)
    } catch (err) {
      setError(err.code ?? 'ai')
      if (err.code === 'limit') setUsed(LIMIT)
      else if (err.used) setUsed(err.used)
    } finally {
      setPending(null)
    }
  }

  function submit(event, picked) {
    event?.preventDefault()
    const question = (picked ?? text).trim()
    if (pending || (!question && !image)) return
    const content = [
      ...(image ? [{ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } }] : []),
      ...(question ? [{ type: 'text', text: question }] : image ? [{ type: 'text', text: 'Lance esta compra.' }] : []),
    ]
    if (picked) setText(picked)
    send(content)
  }

  async function pickImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setImage(await resizeImage(file))
      setError(null)
    } catch {
      setError('image')
    }
  }

  const left = used == null ? null : Math.max(LIMIT - used, 0)

  return (
    <>
      <PageHeader
        title="Assistente"
        description={left == null ? 'Pergunte sobre seus gastos ou lance conversando.' : `${left} de ${LIMIT} mensagens restantes hoje`}
        action={
          turns.length > 0 && (
            <Button variant="outline" onClick={() => conversation.reset()} disabled={Boolean(pending)}>
              <MessageSquarePlus aria-hidden="true" />
              <span className="max-sm:sr-only">Nova conversa</span>
            </Button>
          )
        }
      />

      <div className="grid gap-4" aria-live="polite">
        {turns.length === 0 && !pending && <Welcome onPick={(s) => submit(null, s)} />}

        {turns.map((turn, i) =>
          turn.role === 'user' ? (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2">
              {turn.image && <img src={turn.image} alt="Foto enviada" className="max-h-48 rounded-2xl ring-1 ring-border" />}
              {turn.text && (
                <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 whitespace-pre-wrap text-primary-foreground">
                  {turn.text}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
              <Avatar />
              <div className="grid min-w-0 flex-1 gap-3">
                {turn.text && (
                  <div className="rounded-2xl rounded-tl-md glass px-4 py-3">
                    <Reply text={turn.text} />
                  </div>
                )}
                {turn.proposalIds
                  .filter((pid) => proposals[pid])
                  .map((pid) => (
                    <ProposalCard
                      key={pid}
                      proposal={proposals[pid]}
                      saved={Boolean(saved[pid])}
                      categoriesById={categoriesById}
                      accountsById={accountsById}
                      goalsById={goalsById}
                    />
                  ))}
              </div>
            </motion.div>
          ),
        )}

        {pending && (
          <>
            <div className="flex flex-col items-end gap-2 opacity-70">
              {pending.content.some((b) => b.type === 'image') && image && (
                <img src={image.preview} alt="Foto enviada" className="max-h-48 rounded-2xl ring-1 ring-border" />
              )}
              {pending.content
                .filter((b) => b.type === 'text')
                .map((b, i) => (
                  <p key={i} className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 whitespace-pre-wrap text-primary-foreground">
                    {b.text}
                  </p>
                ))}
            </div>
            <Thinking />
          </>
        )}

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-expense/10 px-4 py-3 text-sm text-expense">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error === 'image' ? 'Não consegui abrir essa foto. Tente outra.' : assistantErrorMessage(error)}
          </p>
        )}
        <span ref={bottom} />
      </div>

      <form
        onSubmit={submit}
        className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mt-6 grid gap-2 rounded-3xl glass p-2 shadow-lg lg:bottom-6"
      >
        {image && (
          <div className="flex items-center gap-2 px-1 pt-1">
            <img src={image.preview} alt="Foto anexada" className="size-14 rounded-xl object-cover ring-1 ring-border" />
            <span className="flex-1 text-sm text-muted-foreground">Foto pronta para enviar</span>
            <Button type="button" variant="ghost" size="icon" className="size-11" onClick={() => setImage(null)} aria-label="Tirar a foto">
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={pickImage} tabIndex={-1} aria-hidden="true" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 text-violet-600 dark:text-violet-300"
            onClick={() => fileInput.current?.click()}
            disabled={Boolean(pending)}
            aria-label="Enviar foto de recibo"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
          </Button>
          <label htmlFor={`${id}-text`} className="sr-only">
            Mensagem para o assistente
          </label>
          <textarea
            id={`${id}-text`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit(e)
            }}
            rows={1}
            maxLength={2000}
            placeholder="Pergunte ou lance: “mercado 184 hoje”"
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-1 py-2.5 text-base outline-none [field-sizing:content] placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            className="size-11 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-white"
            disabled={Boolean(pending) || (!text.trim() && !image) || left === 0}
            aria-label="Enviar"
          >
            <ArrowUp className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </form>
      <p className="mt-2 px-2 text-center text-xs text-muted-foreground">
        Para falar em vez de digitar, use o microfone do teclado do celular.
      </p>
    </>
  )
}
