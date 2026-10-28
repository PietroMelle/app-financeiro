import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { categoryErrorMessage } from './categoryRules'

// state: { open, key, category } | null
export default function DeleteCategoryDialog({ state, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false)

  return (
    <AlertDialog open={Boolean(state?.open)} onOpenChange={(open) => !open && !busy && onClose()}>
      <AlertDialogContent>
        {state && (
          <DeleteBody key={state.key} category={state.category} onClose={onClose} onConfirm={onConfirm} onBusyChange={setBusy} />
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeleteBody({ category, onClose, onConfirm, onBusyChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  function setWorking(value) {
    setBusy(value)
    onBusyChange(value)
  }

  async function confirm() {
    setWorking(true)
    setError(null)
    try {
      await onConfirm(category.id)
      setWorking(false)
      onClose()
    } catch (err) {
      setError(categoryErrorMessage(err, 'apagar'))
      setWorking(false)
    }
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Apagar “{category.name}”?</AlertDialogTitle>
        <AlertDialogDescription>
          Os lançamentos desta categoria não serão apagados: eles passam a aparecer como “Sem categoria”.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {error && (
        <p role="alert" className="text-sm text-expense">
          {error}
        </p>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
        <Button variant="destructive" onClick={confirm} disabled={busy}>
          {busy ? 'Apagando…' : 'Apagar categoria'}
        </Button>
      </AlertDialogFooter>
    </>
  )
}
