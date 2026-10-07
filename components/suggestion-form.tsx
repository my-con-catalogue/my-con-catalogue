'use client'

import { useActionState } from 'react'
import { submitSuggestion, type FormState } from '@/app/actions/submissions'
import { FormField, FormStatus, inputClass } from '@/components/form-field'

const initial: FormState = { status: 'idle', message: '' }

export function SuggestionForm() {
  const [state, action, pending] = useActionState(submitSuggestion, initial)

  return (
    <form action={action} key={state.status === 'success' ? state.message : undefined} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="s-name" label="Name">
          <input id="s-name" name="name" type="text" maxLength={100} autoComplete="name" className={inputClass} />
        </FormField>
        <FormField id="s-email" label="Email">
          <input id="s-email" name="email" type="email" maxLength={200} autoComplete="email" className={inputClass} />
        </FormField>
        <FormField id="s-social" label="Social media" hint="Optional — add a handle or profile link">
          <input id="s-social" name="socialMedia" type="text" maxLength={300} placeholder="@yourhandle or profile URL" className={inputClass} />
        </FormField>
      </div>
      <FormField id="s-topic" label="Topic" required>
        <select id="s-topic" name="topic" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Choose a topic
          </option>
          <option value="Missing event">Missing event</option>
          <option value="Fan cafe">Fan cafe to add</option>
          <option value="Correction">Correction / wrong info</option>
          <option value="Website feedback">Website feedback</option>
          <option value="Other">Other</option>
        </select>
      </FormField>
      <FormField id="s-message" label="Message" required>
        <textarea id="s-message" name="message" required rows={5} maxLength={3000} className={inputClass} />
      </FormField>
      <FormStatus status={state.status} message={state.message} />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-6 py-3 font-semibold text-background transition-opacity disabled:opacity-60"
      >
        {pending ? 'Sending...' : 'Send suggestion'}
      </button>
    </form>
  )
}
