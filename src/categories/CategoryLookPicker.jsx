import { Check, Sparkles } from 'lucide-react'
import { createElement, useId } from 'react'
import { cn } from '@/lib/utils'
import CategoryIcon from './CategoryIcon'
import { ICON_LABELS, ICONS } from './categoryIcons'
import { slotColor } from './categoryLook'

const COLORS = [1, 2, 3, 4, 5, 6, 7, 8]
const COLOR_NAMES = ['Azul', 'Laranja', 'Verde-água', 'Amarelo', 'Rosa', 'Verde', 'Roxo', 'Vermelho']

const option =
  'relative grid cursor-pointer place-items-center rounded-full transition-[box-shadow,transform] has-checked:ring-2 has-checked:ring-foreground has-checked:ring-offset-2 has-checked:ring-offset-background has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring'

// Cor e ícone da categoria (Q46). null = automático (cor pela ordem, ícone pelo nome).
export default function CategoryLookPicker({ name, color, icon, autoSlot, onChange }) {
  const id = useId()
  const preview = { name: name || 'Categoria', slot: color ?? autoSlot, icon }

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5">
        <CategoryIcon category={preview} />
        <span className="min-w-0 flex-1 truncate font-medium">{name || 'Prévia'}</span>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Cor</legend>
        <div className="flex flex-wrap gap-2.5">
          <label className={cn(option, 'size-9 bg-muted text-muted-foreground')} title="Automática">
            <input
              type="radio"
              name={`${id}-color`}
              checked={color == null}
              onChange={() => onChange({ color: null })}
              className="sr-only"
            />
            <Sparkles className="size-4" aria-hidden="true" />
            <span className="sr-only">Automática</span>
          </label>
          {COLORS.map((slot, i) => (
            <label key={slot} className={cn(option, 'size-9')} style={{ backgroundColor: slotColor(slot) }}>
              <input
                type="radio"
                name={`${id}-color`}
                checked={color === slot}
                onChange={() => onChange({ color: slot })}
                className="sr-only"
              />
              {color === slot && <Check className="size-4 text-white" aria-hidden="true" />}
              <span className="sr-only">{COLOR_NAMES[i]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Ícone</legend>
        <div className="grid grid-cols-6 gap-2 min-[400px]:grid-cols-8">
          <label
            className={cn(option, 'size-10 rounded-xl bg-muted text-muted-foreground')}
            title="Automático pelo nome"
          >
            <input
              type="radio"
              name={`${id}-icon`}
              checked={icon == null}
              onChange={() => onChange({ icon: null })}
              className="sr-only"
            />
            <Sparkles className="size-4" aria-hidden="true" />
            <span className="sr-only">Automático pelo nome</span>
          </label>
          {Object.entries(ICONS).map(([key, Icon]) => (
            <label key={key} className={cn(option, 'size-10 rounded-xl bg-muted')} title={ICON_LABELS[key]}>
              <input
                type="radio"
                name={`${id}-icon`}
                checked={icon === key}
                onChange={() => onChange({ icon: key })}
                className="sr-only"
              />
              {createElement(Icon, { className: 'size-5', 'aria-hidden': true })}
              <span className="sr-only">{ICON_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
