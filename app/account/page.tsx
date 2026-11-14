import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { AccountPortal } from '@/components/account-portal'

export const metadata: Metadata = { title: 'Account and shared bookmarks' }

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams
  return <>
    <PageHeader title="Your bookmark account" description="Sign in to keep your catalogues saved across devices. After signing in, manage shared event lists on their own page." />
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14"><AccountPortal initialMode={mode === 'create' ? 'create' : 'login'} /></section>
  </>
}
