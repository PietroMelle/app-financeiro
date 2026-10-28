import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useSession } from '@/auth/useSession'

const AppShell = lazy(() => import('@/app/AppShell'))
const LoginPage = lazy(() => import('@/auth/LoginPage'))
const CategoriesPage = lazy(() => import('@/categories/CategoriesPage'))
const AccountPage = lazy(() => import('@/pages/AccountPage'))
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'))

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
        <Route
          index
          element={<PlaceholderPage title="Resumo" description="O resumo do mês aparece aqui na etapa de orçamento." />}
        />
        <Route
          path="transacoes"
          element={<PlaceholderPage title="Transações" description="A lista de lançamentos chega na próxima etapa." />}
        />
        <Route
          path="transacoes/nova"
          element={<PlaceholderPage title="Nova transação" description="O lançamento de gastos chega na próxima etapa." />}
        />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="conta" element={<AccountPage session={session} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
