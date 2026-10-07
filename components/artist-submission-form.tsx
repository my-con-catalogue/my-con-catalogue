'use client'

import { useActionState } from 'react'
import { submitArtistCatalogue, type FormState } from '@/app/actions/submissions'
import { FormField, FormStatus, inputClass } from '@/components/form-field'

const initial: FormState = { status: 'idle', message: '' }

export function ArtistSubmissionForm() {
  const [state, action, pending] = useActionState(submitArtistCatalogue, initial)

  return (
    <form action={action} key={state.status === 'success' ? state.message : undefined} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">
          What are you submitting?<span className="text-primary" aria-hidden="true">{' *'}</span>
        </legend>
        <div className="flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 has-[:checked]:border-foreground has-[:checked]:bg-accent">
            <input type="radio" name="submissionType" value="new" defaultChecked required className="accent-primary" />
            New catalogue
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 has-[:checked]:border-foreground has-[:checked]:bg-accent">
            <input type="radio" name="submissionType" value="update" className="accent-primary" />
            Update my info
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 has-[:checked]:border-foreground has-[:checked]:bg-accent">
            <input type="radio" name="submissionType" value="stamp-rally" className="accent-primary" />
            Stamp rally
          </label>
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="a-name" label="Artist / circle name" required>
          <input id="a-name" name="artistName" type="text" required maxLength={100} className={inputClass} />
        </FormField>
        <FormField id="a-ig" label="Instagram handle" required>
          <input id="a-ig" name="instagram" type="text" required maxLength={100} placeholder="@yourhandle" className={inputClass} />
        </FormField>
        <FormField id="a-event" label="Event name & year" required>
          <input id="a-event" name="eventName" type="text" required maxLength={150} placeholder="e.g. Comic Fiesta 2025" className={inputClass} />
        </FormField>
        <FormField id="a-booth" label="Booth number" required>
          <input id="a-booth" name="booth" type="text" required maxLength={30} className={inputClass} />
        </FormField>
      </div>
      <FormField id="a-url" label="Catalogue link" hint="Link to your catalogue image (Instagram post, Google Drive, etc.)">
        <input id="a-url" name="catalogueUrl" type="url" maxLength={500} placeholder="https://" aria-describedby="a-url-hint" className={inputClass} />
      </FormField>
      <FormField id="a-file" label="Upload catalogue file" hint="PDF, JPG, PNG, or WebP · up to 15 MB. Useful when there is no Instagram catalogue post. Uploads are reviewed before anything is published.">
        <input id="a-file" name="catalogueFile" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className={inputClass} />
      </FormField>
      <FormField id="a-fandoms" label="Fandoms" hint="Separate with commas">
        <input id="a-fandoms" name="fandoms" type="text" maxLength={500} placeholder="Genshin Impact, Blue Lock, Original" aria-describedby="a-fandoms-hint" className={inputClass} />
      </FormField>
      <FormField id="a-merch" label="Merch types" hint="Separate with commas">
        <input id="a-merch" name="merchTypes" type="text" maxLength={500} placeholder="Acrylic charms, Stickers, Prints" aria-describedby="a-merch-hint" className={inputClass} />
      </FormField>
      <FormField id="a-notes" label="Anything else?">
        <textarea id="a-notes" name="notes" rows={4} maxLength={2000} className={inputClass} />
      </FormField>
      <FormStatus status={state.status} message={state.message} />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
      >
        {pending ? 'Submitting...' : 'Submit catalogue'}
      </button>
    </form>
  )
}
