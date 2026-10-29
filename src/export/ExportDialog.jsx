import { AlertCircle, ArrowDownRight, ArrowUpRight, Download, FileSpreadsheet } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useId, useMemo, useState } from 'react'
import Money from '@/components/Money'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccounts } from '@/accounts/useAccounts'
import { useCategories } from '@/categories/useCategories'
import { useGoals } from '@/goals/useGoals'
import { toISODate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import * as api from '@/transactions/api'
import { buildCsv, exportFileName, PRESETS, presetRange, summarizeExport, validateRange } from './exportRules'

function download(text, fileName) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName })
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function PresetPicker({ value, onChange }) {
  const id = useId()
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Período</legend>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ value: option, label }) => {
          const selected = option === value
          return (
            <label
              key={option}
              className={cn(
                'flex h-11 cursor-pointer items-center rounded-full px-4 text-sm font-medium ring-1 transition-[color,background-color,box-shadow,scale] active:scale-95 has-focus-visible:outline-2 has-focus-visible:outline-ring motion-reduce:transition-none',
                selected
                  ? 'bg-primary text-primary-foreground ring-transparent'
                  : 'text-muted-foreground ring-border hover:bg-muted hover:text-foreground',
              )}
            >
              <input
                type="radio"
                name={id}
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// Busca os lançamentos do período escolhido; a prévia e o arquivo saem da mesma lista.
function usePeriodTransactions(range) {
  const [state, setState] = useState({ key: null, status: 'loading', transactions: [] })
  const from = range?.from
  const to = range?.to
  const key = range ? `${from}|${to}` : null
  useEffect(() => {
    if (!key) return
    let current = true
    api.listAllTransactions({ from, to }).then(
      (transactions) => current && setState({ key, status: 'ready', transactions }),
      () => current && setState({ key, status: 'error', transactions: [] }),
    )
    return () => {
      current = false
    }
  }, [key, from, to])
  if (!range) return { status: 'idle', transactions: [] }
  return state.key === key ? state : { status: 'loading', transactions: [] }
}

function Preview({ status, summary }) {
  if (status === 'idle') return null
  if (status === 'error') {
    return (
      <p role="alert" className="flex items-center gap-2 rounded-xl bg-expense/10 px-3 py-3 text-sm text-expense">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        Não foi possível buscar os lançamentos. Verifique sua conexão.
      </p>
    )
  }
  if (status === 'loading') {
    return <span aria-hidden="true" className="block h-[5.5rem] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
      aria-live="polite"
      className="flex items-center gap-3 rounded-2xl bg-income/10 p-4 ring-1 ring-income/20"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-income/15 text-income">
        <FileSpreadsheet className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">
          {summary.count === 0
            ? 'Nenhum lançamento neste período'
            : `${summary.count} ${summary.count === 1 ? 'lançamento' : 'lançamentos'}`}
        </p>
        {summary.count > 0 && (
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm tabular-nums">
            <span className="flex items-center gap-1 text-income">
              <ArrowUpRight className="size-4" aria-hidden="true" />
              <span className="sr-only">Entradas: </span>
              <Money cents={summary.inflow} />
            </span>
            <span className="flex items-center gap-1 text-expense">
              <ArrowDownRight className="size-4" aria-hidden="true" />
              <span className="sr-only">Saídas: </span>
              <Money cents={summary.outflow} />
            </span>
          </p>
        )}
      </div>
    </motion.div>
  )
}

function ExportForm({ onClose }) {
  const id = useId()
  const toast = useToast()
  const [today] = useState(() => new Date())
  const [preset, setPreset] = useState('month')
  const [custom, setCustom] = useState(() => ({ from: presetRange('month', today).from, to: toISODate(today) }))

  const customError = preset === 'custom' ? validateRange(custom) : null
  const range = preset === 'custom' ? (customError ? null : custom) : presetRange(preset, today)
  const { status, transactions } = usePeriodTransactions(range)
  const summary = useMemo(() => summarizeExport(transactions), [transactions])

  const { categories } = useCategories()
  const { accounts, defaultAccount, status: accountsStatus } = useAccounts()
  const { goals, status: goalsStatus } = useGoals()
  const namesReady = accountsStatus !== 'loading' && goalsStatus !== 'loading'

  function handleDownload() {
    const csv = buildCsv(transactions, {
      categoriesById: new Map(categories.map((c) => [c.id, c])),
      accountsById: new Map(accounts.map((a) => [a.id, a])),
      goalsById: new Map(goals.map((g) => [g.id, g])),
      defaultAccountId: defaultAccount?.id,
    })
    download(csv, exportFileName(range, today))
    toast.show('Planilha baixada')
    onClose()
  }

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle>Exportar lançamentos</DialogTitle>
        <DialogDescription>
          Baixe uma planilha (CSV) que abre no Excel e no Google Planilhas, com data, categoria, conta e valor.
        </DialogDescription>
      </DialogHeader>

      <PresetPicker value={preset} onChange={setPreset} />

      {preset === 'custom' && (
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['from', 'De'],
              ['to', 'Até'],
            ].map(([field, label]) => (
              <div key={field} className="grid gap-2">
                <Label htmlFor={`${id}-${field}`}>{label}</Label>
                <Input
                  id={`${id}-${field}`}
                  type="date"
                  max="9999-12-31"
                  value={custom[field]}
                  onChange={(e) => setCustom((c) => ({ ...c, [field]: e.target.value }))}
                  aria-invalid={Boolean(customError) || undefined}
                  aria-describedby={customError ? `${id}-error` : undefined}
                />
              </div>
            ))}
          </div>
          {customError && (
            <p id={`${id}-error`} role="alert" className="text-sm text-expense">
              {customError}
            </p>
          )}
        </div>
      )}

      <Preview status={status} summary={summary} />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleDownload} disabled={status !== 'ready' || summary.count === 0 || !namesReady}>
          <Download aria-hidden="true" />
          Baixar planilha
        </Button>
      </DialogFooter>
    </div>
  )
}

// O formulário só monta com a janela aberta: as buscas acontecem quando a pessoa pede.
export default function ExportDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <ExportForm onClose={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  )
}
