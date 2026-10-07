import type { Metadata } from 'next'
import { ArtistSubmissionForm } from '@/components/artist-submission-form'
import { PageHeader } from '@/components/page-header'
import { SuggestionForm } from '@/components/suggestion-form'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Send a suggestion or submit your Artist Alley catalogue to Malaysia Convention Catalogue.',
}

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        description="Got a suggestion, or want your catalogue in the archive? Pick the form that fits."
      >
        <nav aria-label="Forms" className="mt-6 flex flex-wrap gap-2">
          <a href="#suggestion-form" className="rounded-full border border-foreground bg-card px-4 py-2 text-sm font-semibold hover:bg-foreground hover:text-background">
            Suggestion
          </a>
          <a href="#artist-form" className="rounded-full border border-foreground bg-card px-4 py-2 text-sm font-semibold hover:bg-foreground hover:text-background">
            Artist catalogue
          </a>
        </nav>
      </PageHeader>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1fr_1.4fr]">
        <section id="suggestion-form" aria-labelledby="suggestion-heading" className="scroll-mt-24 self-start rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 id="suggestion-heading" className="text-2xl font-extrabold">Send a suggestion</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Missing event, fan cafe tip, correction or general feedback.
          </p>
          <div className="mt-6">
            <SuggestionForm />
          </div>
        </section>
        <section id="artist-form" aria-labelledby="artist-heading" className="scroll-mt-24 rounded-2xl border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_var(--color-foreground)] md:p-8">
          <h2 id="artist-heading" className="text-2xl font-extrabold">Submit your artist catalogue</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Are you an artist whose catalogue isn&apos;t listed for an event, or want to update your info? Fill
            this in and we&apos;ll review it.
          </p>
          <div className="mt-6">
            <ArtistSubmissionForm />
          </div>
        </section>
      </div>
    </>
  )
}
