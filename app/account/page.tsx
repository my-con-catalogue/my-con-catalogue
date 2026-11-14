import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { AccountPortal } from '@/components/account-portal'

export const metadata: Metadata = { title: 'Account and shared bookmarks' }

export default function AccountPage() {
  return <>
    <PageHeader title="Your bookmark account" description="Sign in to keep your catalogues saved across devices, or create an event list to plan with friends." />
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14"><AccountPortal /></section>
  </>
}
