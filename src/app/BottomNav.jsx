import { Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, NavLink, useMatch } from 'react-router'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, NEW_TRANSACTION_PATH } from './navItems'

const spring = { type: 'spring', bounce: 0, visualDuration: 0.3 }

function NavItem({ item }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium tracking-tight transition-colors',
          isActive ? 'text-link' : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative grid h-7 w-12 place-items-center">
            {isActive && (
              <motion.span
                layoutId="bottom-nav-indicator"
                transition={spring}
                className="absolute inset-0 rounded-full bg-primary/12"
              />
            )}
            <Icon className="relative size-5" aria-hidden="true" />
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  )
}

export default function BottomNav() {
  const left = NAV_ITEMS.slice(0, 2)
  const right = NAV_ITEMS.slice(2)
  // No formulário de lançamento o "+" não tem função e cobriria o fim da página.
  const onForm = Boolean(useMatch('/transacoes/:id'))

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 glass rounded-none border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch gap-0.5 px-1 min-[360px]:px-2">
        {left.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}

        <div className="relative flex w-16 shrink-0 justify-center min-[360px]:w-20">
          {!onForm && (
            <motion.div whileTap={{ scale: 0.94 }} transition={spring} className="absolute -top-7">
              <Link
                to={NEW_TRANSACTION_PATH}
                aria-label="Novo lançamento"
                className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#3730a3] text-white shadow-[0_10px_28px_-8px_rgb(59_130_246/0.85)] ring-[6px] ring-background transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <Plus className="size-7" aria-hidden="true" />
              </Link>
            </motion.div>
          )}
        </div>

        {right.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </div>
    </nav>
  )
}
