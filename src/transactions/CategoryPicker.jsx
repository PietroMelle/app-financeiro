import { useId } from 'react'
import CategoryIcon from '@/categories/CategoryIcon'
import { sortByName } from '@/categories/categoryRules'
import { cn } from '@/lib/utils'

export default function CategoryPicker({ categories, kind, value, onChange, describedBy }) {
  const id = useId()
  const options = [...sortByName(categories.filter((c) => c.kind === kind)), { id: null, name: 'Sem categoria' }]

  return (
    <fieldset aria-describedby={describedBy}>
      <legend className="mb-2 text-sm font-medium">Categoria</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.id === value
          return (
            <label
              key={option.id ?? 'none'}
              className={cn(
                'flex h-11 cursor-pointer items-center gap-2 rounded-full border pr-4 pl-2 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
                option.id === null && 'pl-4',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-card text-foreground hover:bg-muted',
                option.id === null && !selected && 'border-dashed text-muted-foreground',
              )}
            >
              <input
                type="radio"
                name={id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />
              {option.id !== null && (
                <CategoryIcon
                  category={option}
                  className={cn('size-7', selected && 'bg-white/20! text-white!')}
                  iconClassName="size-4"
                />
              )}
              {option.name}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
