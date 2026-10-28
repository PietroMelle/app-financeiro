import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { monthLabel } from '@/lib/dates'

export default function MonthSwitcher({ month, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-card p-1">
      <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Mês anterior">
        <ChevronLeft className="size-5" aria-hidden="true" />
      </Button>
      <p aria-live="polite" className="font-medium tabular-nums">
        {monthLabel(month)}
      </p>
      <Button variant="ghost" size="icon" onClick={onNext} aria-label="Próximo mês">
        <ChevronRight className="size-5" aria-hidden="true" />
      </Button>
    </div>
  )
}
