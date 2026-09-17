const ELLIPSIS = '…'

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  if (maxChars <= 1) return ELLIPSIS.slice(0, Math.max(maxChars, 0))
  // The end of a file name carries the extension, so it gets the extra char.
  const keepEnd = Math.ceil((maxChars - 1) / 2)
  const keepStart = maxChars - 1 - keepEnd
  return text.slice(0, keepStart) + ELLIPSIS + text.slice(text.length - keepEnd)
}

/**
 * Shortens a relative path so the file name stays readable:
 * `Playbooks/Phishing/Deep/triage.soardiag` → `Playbooks/…/triage.soardiag`.
 * Falls back to `…/name`, then to shortening the name itself.
 */
export function truncateMiddle(path: string, maxChars: number): string {
  if (path.length <= maxChars) return path

  const dirs = path.split('/')
  const name = dirs.pop() ?? ''
  const head = dirs.shift()

  if (head !== undefined) {
    let tail = name
    while (dirs.length > 0) {
      const next = `${dirs[dirs.length - 1]}/${tail}`
      if (`${head}/${ELLIPSIS}/${next}`.length > maxChars) break
      tail = next
      dirs.pop()
    }

    const withHead = `${head}/${ELLIPSIS}/${tail}`
    if (withHead.length <= maxChars) return withHead

    const nameOnly = `${ELLIPSIS}/${name}`
    if (nameOnly.length <= maxChars) return nameOnly
  }

  return truncateText(name, maxChars)
}
