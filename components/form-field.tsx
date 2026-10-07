import type { ReactNode } from 'react'

export const inputClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring'

export function FormField({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required ? (
          <span className="text-primary" aria-hidden="true">
            {' *'}
          </span>
        ) : (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}

export function FormStatus({ status, message }: { status: string; message: string }) {
  if (status === 'idle') return null
  return (
    <p
      role={status === 'error' ? 'alert' : 'status'}
      className={
        status === 'success'
          ? 'rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground'
          : 'rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive'
      }
    >
      {message}
    </p>
  )
}
