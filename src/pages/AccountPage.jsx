import { LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { motion } from 'motion/react'
import { useId, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getThemePreference, setThemePreference } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const THEMES = [
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

function ThemePicker() {
  const id = useId()
  const [value, setValue] = useState(getThemePreference)

  function choose(next) {
    setValue(next)
    setThemePreference(next)
  }

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Tema</legend>
      <div className="grid grid-cols-3 rounded-xl bg-muted p-1">
        {THEMES.map(({ value: option, label, icon: Icon }) => {
          const selected = option === value
          return (
            <label
              key={option}
              className={cn(
                'relative flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ring',
                selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <input
                type="radio"
                name={id}
                value={option}
                checked={selected}
                onChange={() => choose(option)}
                className="sr-only"
              />
              {selected && (
                <motion.span
                  layoutId={`${id}-indicator`}
                  transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
                  className="absolute inset-0 rounded-lg bg-raised shadow-sm ring-1 ring-border"
                />
              )}
              <Icon className="relative size-4" aria-hidden="true" />
              <span className="relative">{label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function NameForm({ session }) {
  const id = useId()
  const toast = useToast()
  const saved = session.user.user_metadata?.first_name ?? ''
  const [name, setName] = useState(saved)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ data: { first_name: name.trim() } })
    setBusy(false)
    if (error) setError('Não foi possível salvar. Tente de novo.')
    else toast.show('Nome salvo')
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2">
      <Label htmlFor={`${id}-name`}>Como quer ser chamado</Label>
      <div className="flex gap-2">
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="given-name"
          placeholder="Seu primeiro nome"
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <Button type="submit" variant="outline" disabled={busy || name.trim() === saved}>
          {busy ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-expense">
          {error}
        </p>
      )}
    </form>
  )
}

export default function AccountPage({ session }) {
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    await supabase.auth.signOut()
  }

  return (
    <>
      <PageHeader title="Conta" />

      <section className="grid gap-6 rounded-2xl glass p-5">
        <div>
          <p className="text-sm text-muted-foreground">Conectado como</p>
          <p className="mt-1 font-medium break-all">{session.user.email}</p>
        </div>
        <NameForm session={session} />
        <ThemePicker />
      </section>

      <section className="mt-10 border-t pt-6">
        <Button variant="outline" onClick={signOut} disabled={busy} className="w-full sm:w-auto">
          <LogOut aria-hidden="true" />
          {busy ? 'Saindo…' : 'Sair da conta'}
        </Button>
      </section>
    </>
  )
}
