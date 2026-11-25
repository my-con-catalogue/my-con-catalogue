/** Merge tag variants that differ only by capitalization or surrounding spaces. */
export function uniqueSortedTags(groups: readonly (readonly string[] | null | undefined)[]) {
  const variants = new Map<string, Map<string, number>>()
  for (const group of groups) {
    for (const rawTag of group ?? []) {
      if (typeof rawTag !== 'string') continue
      const tag = rawTag.trim()
      if (!tag) continue
      const key = tag.toLocaleLowerCase()
      const counts = variants.get(key) ?? new Map<string, number>()
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
      variants.set(key, counts)
    }
  }

  return [...variants.values()]
    .map((counts) => [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }))[0][0])
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
}

export function normalizedTag(tag: string) {
  return tag.trim().toLocaleLowerCase()
}

export function hasSelectedTag(tags: readonly string[], selected: ReadonlySet<string>) {
  return selected.size === 0 || tags.some((tag) => selected.has(normalizedTag(tag)))
}
