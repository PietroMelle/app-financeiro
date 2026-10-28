import { AlertCircle, Plus, Tags } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useId, useMemo, useState } from 'react'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import CategoryFormDialog from './CategoryFormDialog'
import CategoryRow from './CategoryRow'
import { sortByName } from './categoryRules'
import DeleteCategoryDialog from './DeleteCategoryDialog'
import KindTabs from './KindTabs'
import { KINDS } from './kinds'
import { useCategories } from './useCategories'

function ListSkeleton() {
  return (
    <ul aria-hidden="true" className="overflow-hidden rounded-xl border bg-card">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
          <span className="size-10 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          <span className="h-4 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </li>
      ))}
    </ul>
  )
}

export default function CategoriesPage() {
  const tabsId = useId()
  const { categories, status, reload, create, update, remove } = useCategories()
  const [kind, setKind] = useState('expense')
  const [form, setForm] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const toast = useToast()

  const openForm = (data) => setForm({ ...data, open: true, key: Date.now() })
  const closeForm = () => setForm((f) => f && { ...f, open: false })
  const openDelete = (category) => setToDelete({ category, open: true, key: Date.now() })
  const closeDelete = () => setToDelete((d) => d && { ...d, open: false })

  const counts = useMemo(
    () => ({
      expense: categories.filter((c) => c.kind === 'expense').length,
      income: categories.filter((c) => c.kind === 'income').length,
    }),
    [categories],
  )
  const visible = useMemo(() => sortByName(categories.filter((c) => c.kind === kind)), [categories, kind])

  async function handleCreate(input) {
    await create(input)
    setKind(input.kind)
    toast.show('Categoria criada')
  }

  async function handleUpdate(id, changes) {
    await update(id, changes)
    toast.show('Categoria atualizada')
  }

  async function handleDelete(id) {
    await remove(id)
    toast.show('Categoria apagada')
  }

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Agrupe seus lançamentos."
        action={
          <Button variant="outline" onClick={() => openForm({ type: 'create', kind })}>
            <Plus aria-hidden="true" />
            Nova categoria
          </Button>
        }
      />

      <KindTabs value={kind} onChange={setKind} counts={counts} idPrefix={tabsId} />

      <section
        id={`${tabsId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-tab-${kind}`}
        aria-busy={status === 'loading'}
        className="mt-4"
      >
        {status === 'loading' && <ListSkeleton />}

        {status === 'error' && (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar as categorias"
            description="Verifique sua conexão e tente de novo."
            action={
              <Button variant="outline" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        )}

        {status === 'ready' && visible.length === 0 && (
          <EmptyState
            icon={Tags}
            title={`Nenhuma categoria de ${KINDS[kind].singular.toLowerCase()}`}
            description="Crie uma categoria para começar a organizar seus lançamentos."
            action={
              <Button onClick={() => openForm({ type: 'create', kind })}>
                <Plus aria-hidden="true" />
                Nova categoria
              </Button>
            }
          />
        )}

        {status === 'ready' && visible.length > 0 && (
          <ul className="relative overflow-hidden rounded-xl border bg-card">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((category, index) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  index={index}
                  onEdit={(c) => openForm({ type: 'edit', category: c })}
                  onDelete={openDelete}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <CategoryFormDialog
        state={form}
        categories={categories}
        onClose={closeForm}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
      <DeleteCategoryDialog state={toDelete} onClose={closeDelete} onConfirm={handleDelete} />
    </>
  )
}
