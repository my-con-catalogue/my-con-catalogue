import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { SharedListsPortal } from '@/components/shared-lists-portal'

export const metadata: Metadata = { title: 'Shared event lists' }

export default function SharedListsPage() {
  return <>
    <PageHeader title="Shared event lists" description="Plan convention visits together with saved booths, member labels, and notes." />
    <section className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 md:py-14"><SharedListsPortal /></section>
  </>
}
