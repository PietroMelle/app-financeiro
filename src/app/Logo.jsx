import { cn } from '@/lib/utils'

export default function Logo({ className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#3730a3] text-sm font-semibold tracking-tight text-white shadow-[0_6px_16px_-6px_rgb(37_99_235/0.8)] ring-1 ring-white/15"
      >
        M
        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-gold ring-2 ring-background" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        MEA <span className="font-normal text-muted-foreground">Finanças</span>
      </span>
    </div>
  )
}
