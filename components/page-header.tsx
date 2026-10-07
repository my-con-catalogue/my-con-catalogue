import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="border-b border-border bg-secondary/60">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
        {description && (
          <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}
