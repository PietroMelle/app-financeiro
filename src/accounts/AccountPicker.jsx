import { useId } from 'react'
import { cn } from '@/lib/utils'
import AccountIcon from './AccountIcon'

// Escolha de conta em chips, como o seletor de categoria. exclude esconde uma conta (origem da transferência).
export default function AccountPicker({ legend, accounts, value, onChange, exclude, describedBy }) {
  const id = useId()
  const options = accounts.filter((a) => a.id !== exclude)

  return (
    <fieldset aria-describedby={describedBy}>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((account) => {
          const selected = account.id === value
          return (
            <label
              key={account.id}
              className={cn(
                'flex h-11 cursor-pointer items-center gap-2 rounded-full border pr-4 pl-2 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card text-foreground hover:bg-muted',
              )}
            >
              <input type="radio" name={id} checked={selected} onChange={() => onChange(account.id)} className="sr-only" />
              <AccountIcon
                account={account}
                className={cn('size-7', selected && 'bg-white/20! text-white!')}
                iconClassName="size-4"
              />
              {account.name}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
