'use client'

import { useActionState } from 'react'
import { submitFanCafe, type FormState } from '@/app/actions/submissions'
import { FormField, FormStatus, inputClass } from '@/components/form-field'

const initial: FormState = { status: 'idle', message: '' }

export function FanCafeSubmissionForm() {
  const [state, action, pending] = useActionState(submitFanCafe, initial)

  return (
    <form action={action} key={state.status === 'success' ? state.message : undefined} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="fc-name" label="Event name" required>
          <input id="fc-name" name="name" type="text" required maxLength={150} className={inputClass} />
        </FormField>
        <FormField id="fc-location" label="Location" required>
          <input id="fc-location" name="location" type="text" required maxLength={200} placeholder="Cafe name, city, or venue" className={inputClass} />
        </FormField>
        <FormField id="fc-start-date" label="Start date" required>
          <input id="fc-start-date" name="startDate" type="date" required className={inputClass} />
        </FormField>
        <FormField id="fc-end-date" label="End date">
          <input id="fc-end-date" name="endDate" type="date" className={inputClass} />
        </FormField>
        <FormField id="fc-platform" label="Social platform" required>
          <select id="fc-platform" name="socialPlatform" required defaultValue="" className={inputClass}>
            <option value="" disabled>Choose a platform</option>
            <option>Instagram</option>
            <option>TikTok</option>
            <option>X</option>
            <option>Facebook</option>
            <option>Other</option>
          </select>
        </FormField>
        <FormField id="fc-account" label="Social media account" required hint="Add the @handle or a link to the official event account">
          <input id="fc-account" name="socialAccount" type="text" required maxLength={300} placeholder="@account or profile URL" aria-describedby="fc-account-hint" className={inputClass} />
        </FormField>
      </div>
      <FormField id="fc-fandom" label="Fandom" required>
        <input id="fc-fandom" name="fandom" type="text" required maxLength={150} placeholder="e.g. Alien Stage, Genshin Impact, ORV, multi-fandom" className={inputClass} />
      </FormField>
      <FormField id="fc-notes" label="Extra details">
        <textarea id="fc-notes" name="notes" rows={3} maxLength={2000} placeholder="Theme, booking info, or anything else fans should know" className={inputClass} />
      </FormField>
      <p className="text-xs leading-relaxed text-muted-foreground">Submissions are reviewed before being added to the public fan cafe directory.</p>
      <FormStatus status={state.status} message={state.message} />
      <button type="submit" disabled={pending} className="self-start rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity disabled:opacity-60">
        {pending ? 'Submitting...' : 'Submit fan cafe'}
      </button>
    </form>
  )
}
