import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'motion/react'
import { useId, useState } from 'react'
import Logo from '@/app/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { authErrorMessage, isExistingUserSignUp } from './authErrors'

export default function LoginPage() {
  const id = useId()
  const [mode, setMode] = useState('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const isSignUp = mode === 'signUp'

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setError(authErrorMessage(error))
      else if (isExistingUserSignUp(data)) setError(authErrorMessage({ code: 'user_already_exists' }))
      else if (!data.session) setNotice('Conta criada. Enviamos um link de confirmação para o seu e-mail.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(authErrorMessage(error))
    }

    setBusy(false)
  }

  function toggleMode() {
    setMode(isSignUp ? 'signIn' : 'signUp')
    setError(null)
    setNotice(null)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo className="justify-center" />

        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
              <h1 className="text-xl font-semibold tracking-tight">
                {isSignUp ? 'Crie sua conta' : 'Entre na sua conta'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSignUp ? 'Leva menos de um minuto.' : 'Entre para ver suas finanças.'}
              </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-email`}>E-mail</Label>
              <Input
                id={`${id}-email`}
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={error ? `${id}-error` : undefined}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${id}-password`}>Senha</Label>
              <div className="relative">
                <Input
                  id={`${id}-password`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={[isSignUp && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined}
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  className="absolute top-0 right-0 text-muted-foreground"
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              </div>
              {isSignUp && (
                <p id={`${id}-hint`} className="text-sm text-muted-foreground">
                  Pelo menos 6 caracteres.
                </p>
              )}
            </div>

            {error && (
              <p id={`${id}-error`} role="alert" className="text-sm text-expense">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-lg bg-income/10 px-3 py-2 text-sm text-income">
                {notice}
              </p>
            )}

            <Button type="submit" size="lg" disabled={busy || !email || !password} className="mt-2">
              {busy ? 'Aguarde…' : isSignUp ? 'Criar conta' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
          <button type="button" onClick={toggleMode} className="font-medium text-link underline-offset-4 hover:underline">
            {isSignUp ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
      </div>
    </main>
  )
}
