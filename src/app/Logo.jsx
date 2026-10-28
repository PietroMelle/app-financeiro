import { cn } from '@/lib/utils'

export default function Logo({ className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-semibold tracking-tight text-primary-foreground"
      >
        M
      </span>
      <span className="text-lg font-semibold tracking-tight">
        MEA <span className="font-normal text-muted-foreground">Finanças</span>
      </span>
    </div>
  )
}
