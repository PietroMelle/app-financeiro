import { AlertCircle, ArrowLeftRight, EllipsisVertical, ListFilter, Pencil, Plus, Star, Trash2, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { NEW_TRANSACTION_PATH } from '@/app/navItems'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'
import { useToast } from '@/components/useToast'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useGoals } from '@/goals/useGoals'
import { formatCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import AccountIcon from './AccountIcon'
import BalanceTotal from './BalanceTotal'
import { AccountFormDialog, DeleteAccountDialog } from './AccountDialogs'
import { totalBalance } from './accountRules'
import { ACCOUNT_TYPES } from './accountTypes'
import { useAccounts } from './useAccounts'

function Skeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4">
      <span className="h-32 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none" />
      <span className="h-48 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
    </div>
  )
}

export default function AccountsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { status, accounts, balances, refresh, create, update, remove, makeDefault } = useAccounts()
  const { saved } = useGoals()
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const reserved = [...saved.values()].reduce((s, c) => s + c, 0)
  const open = (data) => ({ ...data, open: true, key: Date.now() })
  const transfer = () => navigate(NEW_TRANSACTION_PATH, { state: { draft: { kind: 'transfer' } } })

  return (
    <>
      <PageHeader
        title="Contas"
        description="Onde está o seu dinheiro."
        action={
          <Button variant="outline" onClick={() => setForm(open({}))}>
            <Plus aria-hidden="true" />
            Nova conta
          </Button>
        }
      />

      {status === 'loading' && <Skeleton />}

      {status === 'error' && (
        <EmptyState
          icon={AlertCircle}
          title="Não foi possível carregar as contas"
          description="Verifique sua conexão e tente de novo."
          action={
            <Button variant="outline" onClick={refresh}>
              Tentar de novo
            </Button>
          }
        />
      )}

      {status === 'ready' && accounts.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="Nenhuma conta ainda"
          description="Cadastre onde está o seu dinheiro: banco, carteira, poupança."
          action={
            <Button onClick={() => setForm(open({}))}>
              <Plus aria-hidden="true" />
              Nova conta
            </Button>
          }
        />
      )}

      {status === 'ready' && accounts.length > 0 && (
        <div className="grid grid-cols-1 gap-5">
          <BalanceTotal total={totalBalance(balances)} reserved={reserved} />

          <Button variant="outline" onClick={transfer} disabled={accounts.length < 2} className="justify-self-start">
            <ArrowLeftRight aria-hidden="true" />
            Transferir entre contas
          </Button>

          <ul className="overflow-hidden rounded-2xl glass">
            {accounts.map((account, index) => {
              const balance = balances.get(account.id) ?? account.initialCents
              return (
                <motion.li
                  key={account.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 8) * 0.04 } }}
                  transition={{ type: 'spring', bounce: 0, visualDuration: 0.3 }}
                  className="flex items-center gap-3 border-b py-2 pr-2 pl-4 last:border-b-0"
                >
                  <AccountIcon account={account} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{account.name}</span>
                      {account.isDefault && (
                        <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-link">
                          Padrão
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-muted-foreground">{ACCOUNT_TYPES[account.type].label}</span>
                  </span>
                  <span className={cn('shrink-0 font-semibold tabular-nums', balance < 0 && 'text-expense')}>
                    {balance < 0 ? `− ${formatCents(-balance)}` : formatCents(balance)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-11" aria-label={`Ações para ${account.name}`}>
                        <EllipsisVertical className="size-5" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-48">
                      <DropdownMenuItem asChild className="h-11">
                        <Link to={`/transacoes?conta=${account.id}`}>
                          <ListFilter aria-hidden="true" />
                          Ver lançamentos
                        </Link>
                      </DropdownMenuItem>
                      {!account.isDefault && (
                        <DropdownMenuItem
                          className="h-11"
                          onSelect={async () => {
                            await makeDefault(account.id)
                            toast.show(`${account.name} agora é a conta padrão`)
                          }}
                        >
                          <Star aria-hidden="true" />
                          Tornar padrão
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => setForm(open({ account }))} className="h-11">
                        <Pencil aria-hidden="true" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={account.isDefault}
                        onSelect={() => setDeleting(open({ account }))}
                        className="h-11"
                      >
                        <Trash2 aria-hidden="true" />
                        Apagar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.li>
              )
            })}
          </ul>
          <p className="px-1 text-sm text-muted-foreground">
            A conta padrão já vem escolhida nos lançamentos. Para apagar a padrão, escolha outra antes.
          </p>
        </div>
      )}

      <AccountFormDialog
        state={form}
        accounts={accounts}
        onClose={() => setForm((f) => f && { ...f, open: false })}
        onCreate={async (input) => {
          await create(input)
          toast.show('Conta criada')
        }}
        onUpdate={async (id, input) => {
          await update(id, input)
          toast.show('Conta atualizada')
        }}
      />
      <DeleteAccountDialog
        key={deleting?.key}
        state={deleting}
        onClose={() => setDeleting((d) => d && { ...d, open: false })}
        onConfirm={async (account) => {
          await remove(account.id)
          toast.show('Conta apagada')
        }}
      />
    </>
  )
}
