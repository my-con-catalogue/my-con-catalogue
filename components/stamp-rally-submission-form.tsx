'use client'

import { useActionState } from 'react'
import { submitStampRally, type FormState } from '@/app/actions/submissions'
import { FormField, FormStatus, inputClass } from '@/components/form-field'

const initial: FormState = { status: 'idle', message: '' }

export function StampRallySubmissionForm() {
  const [state, action, pending] = useActionState(submitStampRally, initial)

  return (
    <form action={action} key={state.status === 'success' ? state.message : undefined} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="sr-artists" label="Artist names" hint="Use commas if there are multiple artists." required>
          <input id="sr-artists" name="artistNames" type="text" required maxLength={500} aria-describedby="sr-artists-hint" className={inputClass} />
        </FormField>
        <FormField id="sr-socials" label="Social media handles" hint="Example: @mycc (IG). Use commas for multiple handles." required>
          <input id="sr-socials" name="socialMediaHandles" type="text" required maxLength={500} placeholder="@mycc (IG)" aria-describedby="sr-socials-hint" className={inputClass} />
        </FormField>
        <FormField id="sr-event" label="Event name & year" required>
          <input id="sr-event" name="eventName" type="text" required maxLength={150} placeholder="e.g. Comic Fiesta 2026" className={inputClass} />
        </FormField>
        <FormField id="sr-fandom" label="Fandom" required>
          <input id="sr-fandom" name="fandom" type="text" required maxLength={200} placeholder="e.g. Alien Stage" className={inputClass} />
        </FormField>
      </div>
      <FormField id="sr-link" label="Stamp rally post link" hint="Add a link to the post if one is available.">
        <input id="sr-link" name="postLink" type="url" maxLength={500} placeholder="https://" aria-describedby="sr-link-hint" className={inputClass} />
      </FormField>
      <FormField id="sr-file" label="Upload file" hint="PDF, JPG, PNG, or WebP · up to 15 MB.">
        <input id="sr-file" name="stampRallyFile" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" aria-describedby="sr-file-hint" className={inputClass} />
      </FormField>
      <FormField id="sr-notes" label="Anything else?">
        <textarea id="sr-notes" name="notes" rows={4} maxLength={2000} className={inputClass} />
      </FormField>
      <FormStatus status={state.status} message={state.message} />
      <button type="submit" disabled={pending} className="self-start rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity disabled:opacity-60">
        {pending ? 'Submitting...' : 'Submit stamp rally'}
      </button>
    </form>
  )
}
