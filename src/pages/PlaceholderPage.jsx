import { Construction } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import PageHeader from '@/components/PageHeader'

export default function PlaceholderPage({ title, description }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={Construction} title="Em construção" description={description} />
    </>
  )
}
