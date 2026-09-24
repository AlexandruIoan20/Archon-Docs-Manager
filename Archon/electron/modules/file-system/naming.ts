import { readdir } from 'fs/promises'
import { fileNameProblem, RESERVED_NAMES } from '@/core/validation/file-name'
import { AppError } from '../errors'

export { fileNameProblem }

const MAX_SLUG_LENGTH = 60

export function assertValidFileName(name: string): void {
  const problem = fileNameProblem(name)
  if (problem) throw new AppError('INVALID_NAME', problem)
}

/** A file-name-safe version of a title: lowercase, ASCII, dash-separated. */
export function slugify(title: string, fallback = 'untitled'): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, '')
  return slug === '' || RESERVED_NAMES.test(slug) ? fallback : slug
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * `<base>-N<ext>` with N one above the highest existing number, so names never
 * collide and never go back after a file in the middle is deleted.
 */
export async function nextAvailableName(dir: string, base: string, ext: string): Promise<string> {
  const pattern = new RegExp(`^${escapeRegExp(base)}-(\\d+)${escapeRegExp(ext)}$`, 'i')
  let highest = 0
  for (const name of await readdir(dir)) {
    const match = pattern.exec(name)
    if (match) highest = Math.max(highest, Number(match[1]))
  }
  return `${base}-${highest + 1}${ext}`
}

/** `<base><ext>` if free, otherwise the next numbered name. */
export async function availableName(dir: string, base: string, ext: string): Promise<string> {
  const names = new Set((await readdir(dir)).map((name) => name.toLowerCase()))
  const plain = `${base}${ext}`
  return names.has(plain.toLowerCase()) ? nextAvailableName(dir, base, ext) : plain
}
