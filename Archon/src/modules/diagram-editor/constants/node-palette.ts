/**
 * The semantic node colors. They are data (saved in `.ardiag`), not theme:
 * the only hex colors allowed outside the theme files.
 */
export const NODE_PALETTE = [
  { value: '#7C3AED', name: 'Violet' },
  { value: '#2563EB', name: 'Blue' },
  { value: '#D97706', name: 'Amber' },
  { value: '#059669', name: 'Green' },
  { value: '#DC2626', name: 'Red' },
  { value: '#8892A4', name: 'Neutral' }
] as const

export type NodeColor = (typeof NODE_PALETTE)[number]['value']

export const NODE_COLORS = {
  violet: '#7C3AED',
  blue: '#2563EB',
  amber: '#D97706',
  green: '#059669',
  red: '#DC2626',
  neutral: '#8892A4'
} as const satisfies Record<string, NodeColor>

/** The C4 model's customary colors: the defaults of C4 nodes (data, like the palette). */
export const C4_COLORS = {
  person: '#08427B',
  system: '#1168BD',
  container: '#438DD5',
  component: '#85BBF0',
  external: '#8C8496',
  boundary: '#8892A4'
} as const
