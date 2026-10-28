import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { authErrorMessage, isExistingUserSignUp } from './authErrors'

export default function LoginPage() {
  const [mode, setMode] = useState('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold">MEA - Finanças</h1>
        <p className="mt-1 text-center text-sm text-gray-600">
          {isSignUp ? 'Crie sua conta' : 'Entre na sua conta'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1 text-sm font-medium">
            E-mail
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Senha
            <input
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base font-normal"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-green-700">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !email || !password}
            className="rounded-lg bg-gray-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Aguarde…' : isSignUp ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <button type="button" onClick={toggleMode} className="mt-6 w-full text-center text-sm text-gray-600 underline">
          {isSignUp ? 'Já tenho conta' : 'Criar uma conta'}
        </button>
      </div>
    </main>
  )
}
