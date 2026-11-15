import type { Metadata } from 'next'
import { SharedBookmarkGroup } from '@/components/shared-bookmark-group'

export const metadata: Metadata = { title: 'Shared bookmark list' }
type Props = { params: Promise<{ groupId: string }> }

export default async function SharedBookmarkGroupPage({ params }: Props) {
  const { groupId } = await params
  return <section className="mx-auto max-w-6xl px-4 py-10 md:py-14"><SharedBookmarkGroup groupId={groupId} /></section>
}
