import { LogOut } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function AccountPage({ session }) {
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    await supabase.auth.signOut()
  }

  return (
    <>
      <PageHeader title="Conta" />

      <section className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Conectado como</p>
        <p className="mt-1 font-medium break-all">{session.user.email}</p>
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
