'use client'

import { useActionState, useState } from 'react'
import { submitInterestCheck, type FormState } from '@/app/actions/submissions'
import { FormField, FormStatus, inputClass } from '@/components/form-field'

const initial: FormState = { status: 'idle', message: '' }

export function InterestCheckSubmissionForm() {
  const [state, action, pending] = useActionState(submitInterestCheck, initial)
  const [type, setType] = useState('')

  return <form action={action} key={state.status === 'success' ? state.message : undefined} className="flex flex-col gap-4">
    <p className="rounded-lg border border-primary/30 bg-accent/60 p-4 text-sm leading-relaxed">Interest checks must be related to the Malaysia ACG scene.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="ic-name" label="Interest Check Name" required>
        <input id="ic-name" name="interestCheckName" type="text" required maxLength={200} className={inputClass} />
      </FormField>
      <FormField id="ic-type" label="Type" required>
        <select id="ic-type" name="type" value={type} onChange={(event) => setType(event.target.value)} required className={inputClass}>
          <option value="" disabled>Choose a type</option>
          <option>Merch Check</option>
          <option>Stamp Rally</option>
          <option>Fan Gathering</option>
          <option>Cupsleeve Event (CSE)</option>
          <option>Birthday Event</option>
          <option>Other</option>
        </select>
      </FormField>
      {type === 'Other' && <FormField id="ic-other-type" label="Other category" required>
        <input id="ic-other-type" name="otherType" type="text" required maxLength={100} placeholder="Enter the category" className={inputClass} />
      </FormField>}
      <FormField id="ic-fandom" label="Fandom" required>
        <input id="ic-fandom" name="fandom" type="text" required maxLength={300} placeholder="e.g. Alien Stage" className={inputClass} />
      </FormField>
      <FormField id="ic-event" label="Event name">
        <input id="ic-event" name="eventName" type="text" maxLength={200} placeholder="e.g. Comic Fiesta 2026" className={inputClass} />
      </FormField>
      <FormField id="ic-cutoff" label="Cutoff date">
        <input id="ic-cutoff" name="cutoffDate" type="date" className={inputClass} />
      </FormField>
    </div>
    <FormField id="ic-post-link" label="Post link" required>
      <input id="ic-post-link" name="postLink" type="url" required maxLength={500} placeholder="https://" className={inputClass} />
    </FormField>
    <FormStatus status={state.status} message={state.message} />
    <button type="submit" disabled={pending} className="self-start rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity disabled:opacity-60">{pending ? 'Submitting...' : 'Submit interest check'}</button>
  </form>
}
