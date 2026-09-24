/**
 * Icon geometry on a 24×24 grid, stroke-based (Lucide style).
 *
 * Provisional: shapes follow Lucide (ISC license) until the paths from the
 * design prototype's `PATHS` table are copied in. Names and usage stay the same.
 */
export type IconPath = string | { d: string; strokeWidth: number }

const circle = (cx: number, cy: number, r: number): string =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`

const roundedRect = (x: number, y: number, w: number, h: number, r: number): string =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}` +
  `h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`

export const ICON_PATHS = {
  zap: [
    'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z'
  ],
  search: [circle(11, 11, 8), 'm21 21-4.34-4.34'],
  branch: ['M6 3v12', circle(18, 6, 3), circle(6, 18, 3), 'M18 9a9 9 0 0 1-9 9'],
  shield: [
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'
  ],
  alert: [
    'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
    'M12 9v4',
    'M12 17h.01'
  ],
  file: [
    'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z',
    'M14 2v4a2 2 0 0 0 2 2h4',
    'M16 13H8',
    'M16 17H8',
    'M10 9H8'
  ],
  box: [
    'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    'm3.3 7 8.7 5 8.7-5',
    'M12 22V12'
  ],
  folder: [
    'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z'
  ],
  flow: [roundedRect(3, 3, 8, 8, 2), 'M7 11v4a2 2 0 0 0 2 2h4', roundedRect(13, 13, 8, 8, 2)],
  chevD: ['m6 9 6 6 6-6'],
  chevR: ['m9 18 6-6-6-6'],
  cursor: [
    'M4.04 4.69a.5.5 0 0 1 .65-.65l16 6.5a.5.5 0 0 1-.06.95l-6.12 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.12a.5.5 0 0 1-.95.06z'
  ],
  hand: [
    'M18 11V6a2 2 0 0 0-4 0',
    'M14 10V4a2 2 0 0 0-4 0v2',
    'M10 10.5V6a2 2 0 0 0-4 0v8',
    'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15'
  ],
  plusBox: [roundedRect(3, 3, 18, 18, 2), 'M8 12h8', 'M12 8v8'],
  link: [
    'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
    'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'
  ],
  text: ['M12 4v16', 'M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2', 'M9 20h6'],
  rect: [roundedRect(3, 5, 18, 14, 2)],
  circle: [circle(12, 12, 9)],
  trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z'],
  sun: [
    circle(12, 12, 4),
    'M12 2v2',
    'M12 20v2',
    'm4.93 4.93 1.41 1.41',
    'm17.66 17.66 1.41 1.41',
    'M2 12h2',
    'M20 12h2',
    'm6.34 17.66-1.41 1.41',
    'm19.07 4.93-1.41 1.41'
  ],
  grid4: [
    roundedRect(3, 3, 7, 7, 1),
    roundedRect(14, 3, 7, 7, 1),
    roundedRect(14, 14, 7, 7, 1),
    roundedRect(3, 14, 7, 7, 1)
  ],
  layers: [
    'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z',
    'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12',
    'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17'
  ],
  play: ['M5 5a2 2 0 0 1 3.01-1.73l12 7a2 2 0 0 1 0 3.46l-12 7A2 2 0 0 1 5 19z'],
  plus: ['M5 12h14', 'M12 5v14'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  download: ['M12 15V3', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5'],
  undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  redo: ['m15 14 5-5-5-5', 'M20 9H9.5a5.5 5.5 0 0 0 0 11H13'],
  gear: [
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
    circle(12, 12, 3)
  ],
  more: [circle(5, 12, 1), circle(12, 12, 1), circle(19, 12, 1)],
  check: ['M20 6 9 17l-5-5'],
  /** App brand triangle, drawn on the accent square. */
  logo: ['M12 3 4 20h16L12 3Z', 'M8.6 14h6.8'],
  winMinimize: ['M5 12h14'],
  winMaximize: [roundedRect(5, 5, 14, 14, 1)],
  winRestore: [
    roundedRect(5, 8, 11, 11, 1),
    'M8 8V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2'
  ],
  // Text formatting (document editor, plan 12).
  bold: ['M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8'],
  italic: ['M19 4h-9', 'M14 20H5', 'M15 4 9 20'],
  code: ['m16 18 6-6-6-6', 'm8 6-6 6 6 6'],
  heading: ['M6 12h12', 'M6 20V4', 'M18 20V4'],
  heading1: ['M4 12h8', 'M4 18V6', 'M12 18V6', 'm17 12 3-2v8'],
  heading2: ['M4 12h8', 'M4 18V6', 'M12 18V6', 'M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1'],
  heading3: [
    'M4 12h8',
    'M4 18V6',
    'M12 18V6',
    'M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2',
    'M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2'
  ],
  list: ['M3 12h.01', 'M3 18h.01', 'M3 6h.01', 'M8 12h13', 'M8 18h13', 'M8 6h13'],
  listOrdered: [
    'M10 12h11',
    'M10 18h11',
    'M10 6h11',
    'M4 10h2',
    'M4 6h1v4',
    'M6 18H4c0-1 2-2 2-3s-1-1.5-2-1'
  ],
  quote: [
    'M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z',
    'M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z'
  ],
  codeBlock: [roundedRect(3, 3, 18, 18, 2), 'm10 9-3 3 3 3', 'm14 15 3-3-3-3'],
  weight: [
    { d: 'M4 6h16', strokeWidth: 1 },
    { d: 'M4 12h16', strokeWidth: 2 },
    { d: 'M4 18h16', strokeWidth: 3 }
  ]
} as const satisfies Record<string, readonly IconPath[]>

export type IconName = keyof typeof ICON_PATHS

/** Glyphs the prototype draws heavier than the default 1.5. */
export const ICON_DEFAULT_STROKE: Partial<Record<IconName, number>> = {
  chevD: 2,
  chevR: 2,
  close: 2,
  check: 2.2,
  logo: 2.2
}
