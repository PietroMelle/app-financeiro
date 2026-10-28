import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function App() {
  const [status, setStatus] = useState('verificando')

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ error }) => setStatus(error ? 'erro' : 'conectado'))
      .catch(() => setStatus('erro'))
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 p-4 text-center">
      <h1 className="text-2xl font-semibold">MEA - Finanças</h1>
      <p className="text-sm text-gray-600">Supabase: {status}</p>
    </main>
  )
}
