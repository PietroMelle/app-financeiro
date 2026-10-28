import { supabase } from './lib/supabase'
import { useSession } from './auth/useSession'
import LoginPage from './auth/LoginPage'

export default function App() {
  const session = useSession()

  if (session === undefined) return null
  if (!session) return <LoginPage />

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-semibold">MEA - Finanças</h1>
      <p className="text-sm text-gray-600">Logado como {session.user.email}</p>
      <button
        type="button"
        onClick={() => supabase.auth.signOut()}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
      >
        Sair
      </button>
    </main>
  )
}
