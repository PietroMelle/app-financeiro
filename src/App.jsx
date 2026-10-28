import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useSession } from '@/auth/useSession'

const AppShell = lazy(() => import('@/app/AppShell'))
const LoginPage = lazy(() => import('@/auth/LoginPage'))
const CategoriesPage = lazy(() => import('@/categories/CategoriesPage'))
const AccountPage = lazy(() => import('@/pages/AccountPage'))
const RecurrencesPage = lazy(() => import('@/recurring/RecurrencesPage'))
const SummaryPage = lazy(() => import('@/budget/SummaryPage'))
const TransactionsPage = lazy(() => import('@/transactions/TransactionsPage'))
const TransactionFormPage = lazy(() => import('@/transactions/TransactionFormPage'))

export default function App() {
  const session = useSession()

  if (session === undefined) return null

  return (
    <Suspense fallback={null}>
      {session ? <AuthenticatedApp session={session} /> : <LoginPage />}
    </Suspense>
  )
}

function AuthenticatedApp({ session }) {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<SummaryPage session={session} />} />
        <Route path="transacoes" element={<TransactionsPage />} />
        <Route path="transacoes/nova" element={<TransactionFormPage />} />
        <Route path="transacoes/:id" element={<TransactionFormPage />} />
        <Route path="recorrentes" element={<RecurrencesPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="conta" element={<AccountPage session={session} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
