const MAX_NAME_LENGTH = 120
// Windows forbids these everywhere; control characters are never useful in names.
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const FORBIDDEN_CHARS = /[<>:"/\\|?*\u0000-\u001f]/
// Windows device names, with or without an extension.
export const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(\..*)?$/i

/**
 * Why a file or folder name is not allowed on any supported OS, or `null`.
 * Shared: the renderer shows the message inline, main enforces it.
 */
export function fileNameProblem(name: string): string | null {
  if (name.trim() === '') return 'Name cannot be empty'
  if (name.length > MAX_NAME_LENGTH)
    return `Name cannot be longer than ${MAX_NAME_LENGTH} characters`
  if (FORBIDDEN_CHARS.test(name))
    return 'Name cannot contain < > : " / \\ | ? * or control characters'
  if (name.startsWith('.')) return 'Name cannot start with a dot'
  if (/[. ]$/.test(name)) return 'Name cannot end with a dot or a space'
  if (RESERVED_NAMES.test(name)) return `“${name}” is reserved by the operating system`
  return null
}
