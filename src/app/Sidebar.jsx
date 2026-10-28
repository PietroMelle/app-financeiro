import { Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Logo from './Logo'
import { NAV_ITEMS, NEW_TRANSACTION_PATH } from './navItems'

const spring = { type: 'spring', bounce: 0, visualDuration: 0.3 }

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-card px-4 py-6 lg:flex">
      <Logo className="px-2" />

      <Button asChild size="lg" className="mt-8">
        <Link to={NEW_TRANSACTION_PATH}>
          <Plus aria-hidden="true" />
          Nova transação
        </Link>
      </Button>

      <nav aria-label="Principal" className="mt-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive ? 'text-link' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-indicator"
                      transition={spring}
                      className="absolute inset-0 rounded-lg bg-primary/12"
                    />
                  )}
                  <Icon className="relative size-5" aria-hidden="true" />
                  <span className="relative">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
