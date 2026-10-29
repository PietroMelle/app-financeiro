import { AlertCircle, PiggyBank, Plus, Target } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import EmptyState from '@/components/EmptyState'
import Money from '@/components/Money'
import PageHeader from '@/components/PageHeader'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import GoalCard from './GoalCard'
import { DeleteGoalDialog, GoalFormDialog, SaveDialog } from './GoalDialogs'
import { goalProgress } from './goalRules'
import { useGoals } from './useGoals'

function Skeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <span key={i} className="h-52 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
      ))}
    </div>
  )
}

export default function GoalsPage() {
  const toast = useToast()
  const { status, goals, saved, reload, create, update, remove, save } = useGoals()
  const [today] = useState(() => new Date())
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const total = [...saved.values()].reduce((sum, cents) => sum + cents, 0)
  const progressOf = (goal) => goalProgress(goal, saved.get(goal.id) ?? 0, today)
  const open = (data) => ({ ...data, open: true, key: Date.now() })
  const close = (setter) => () => setter((s) => s && { ...s, open: false })

  async function handleSave(goal, input) {
    await save(goal, input)
    toast.show(input.kind === 'withdrawal' ? `Resgatado de ${goal.name}` : `Guardado em ${goal.name}`)
  }

  return (
    <>
      <PageHeader
        title="Metas"
        description="Junte dinheiro para o que importa."
        action={
          <Button variant="outline" onClick={() => setForm(open({}))}>
            <Plus aria-hidden="true" />
            Nova meta
          </Button>
        }
      />

      <div aria-busy={status === 'loading'} className="grid grid-cols-1 gap-5">
        {status === 'loading' && <Skeleton />}

        {status === 'error' && (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar as metas"
            description="Verifique sua conexão e tente de novo."
            action={
              <Button variant="outline" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        )}

        {status === 'ready' && goals.length === 0 && (
          <EmptyState
            icon={Target}
            title="Nenhuma meta ainda"
            description="Crie uma meta, como uma viagem ou a reserva de emergência, e acompanhe quanto já guardou."
            action={
              <Button onClick={() => setForm(open({}))}>
                <Plus aria-hidden="true" />
                Criar primeira meta
              </Button>
            }
          />
        )}

        {status === 'ready' && goals.length > 0 && (
          <>
            <section
              aria-label="Total guardado"
              className="relative isolate flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#3b2a07] via-[#4a3508] to-[#1e3a8a] p-5 text-white ring-1 ring-gold/30"
            >
              <span
                aria-hidden="true"
                className="absolute -top-10 -left-6 -z-10 size-40 rounded-full bg-amber-300/25 blur-3xl animate-aurora motion-reduce:animate-none"
              />
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 text-amber-200 ring-1 ring-white/15">
                <PiggyBank className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80">Total guardado</p>
                <Money cents={total} className="block text-2xl font-semibold tracking-tight" />
                <p className="text-sm text-white/80">
                  em {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
                </p>
              </div>
            </section>

            <ul className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence initial={false} mode="popLayout">
                {goals.map((goal, index) => {
                  const progress = progressOf(goal)
                  return (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      progress={progress}
                      index={index}
                      onSave={(g) => setSaving(open({ goal: g, progress }))}
                      onWithdraw={(g) => setSaving(open({ goal: g, progress, withdraw: true }))}
                      onEdit={(g) => setForm(open({ goal: g }))}
                      onDelete={(g) => setDeleting(open({ goal: g, saved: progress.saved }))}
                    />
                  )
                })}
              </AnimatePresence>
            </ul>
          </>
        )}
      </div>

      <GoalFormDialog
        state={form}
        onClose={close(setForm)}
        onCreate={async (input) => {
          await create(input)
          toast.show('Meta criada')
        }}
        onUpdate={async (id, input) => {
          await update(id, input)
          toast.show('Meta atualizada')
        }}
      />
      <SaveDialog state={saving} onClose={close(setSaving)} onSave={handleSave} />
      <DeleteGoalDialog
        key={deleting?.key}
        state={deleting}
        onClose={close(setDeleting)}
        onConfirm={async (goal) => {
          await remove(goal.id)
          toast.show('Meta apagada')
        }}
      />
    </>
  )
}
