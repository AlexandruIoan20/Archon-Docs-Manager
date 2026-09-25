import type { UmlDiagramType } from '@/core/types'

/** A primitive of a catalog sketch, in a 160×54 box. */
export type SketchShape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'path'; d: string; dashed?: boolean }

export const SKETCH_SIZE = { width: 160, height: 54 } as const

const rect = (x: number, y: number, w: number, h: number, r?: number): SketchShape => ({
  kind: 'rect',
  x,
  y,
  w,
  h,
  r
})
const path = (d: string, dashed?: boolean): SketchShape => ({ kind: 'path', d, dashed })
const circle = (cx: number, cy: number, r: number): SketchShape => ({ kind: 'circle', cx, cy, r })

/** The notation of each type, drawn small: what the card shows. */
export const SKETCHES: Record<UmlDiagramType, readonly SketchShape[]> = {
  class: [
    rect(14, 6, 48, 42, 2),
    path('M14 18h48M14 32h48'),
    rect(98, 6, 48, 42, 2),
    path('M98 18h48M98 32h48'),
    path('M62 27h36M91 23l7 4-7 4')
  ],
  object: [
    rect(16, 12, 50, 30, 2),
    path('M27 24h28'),
    rect(94, 12, 50, 30, 2),
    path('M105 24h28'),
    path('M66 27h28')
  ],
  component: [
    rect(40, 10, 76, 34, 2),
    rect(34, 16, 12, 6),
    rect(34, 30, 12, 6),
    path('M116 27h16'),
    circle(137, 27, 5)
  ],
  composite: [
    rect(8, 5, 144, 44, 3),
    rect(20, 15, 44, 24, 2),
    rect(96, 15, 44, 24, 2),
    path('M64 27h32'),
    rect(61, 24, 6, 6),
    rect(93, 24, 6, 6)
  ],
  package: [
    rect(20, 8, 32, 8, 1),
    rect(20, 16, 120, 32, 2),
    rect(34, 24, 30, 16, 2),
    rect(96, 24, 30, 16, 2),
    path('M64 32h32', true)
  ],
  deployment: [
    rect(30, 14, 96, 34),
    path('M30 14l8-8h96v34l-8 8M126 14l8-8'),
    rect(48, 22, 60, 18, 2),
    path('M54 28h24')
  ],
  profile: [
    rect(18, 10, 52, 34, 2),
    path('M28 20h32M28 30h24'),
    rect(104, 10, 42, 34, 2),
    path('M70 27h26M96 21l8 6-8 6z')
  ],
  usecase: [
    circle(22, 11, 5),
    path('M22 16v15M14 21h16M22 31l-6 11M22 31l6 11'),
    path('M36 27h26'),
    { kind: 'ellipse', cx: 106, cy: 27, rx: 42, ry: 15 }
  ],
  activity: [
    circle(12, 27, 5),
    path('M17 27h13'),
    rect(30, 17, 38, 20, 9),
    path('M68 27h14'),
    path('M82 27l10-10 10 10-10 10z'),
    path('M102 27h14'),
    rect(116, 17, 36, 20, 9)
  ],
  state: [
    circle(12, 27, 4),
    path('M16 27h14'),
    rect(30, 15, 46, 24, 10),
    path('M76 27h24M94 23l6 4-6 4'),
    rect(100, 15, 46, 24, 10)
  ],
  sequence: [
    rect(22, 4, 40, 12, 2),
    path('M42 16v34', true),
    rect(98, 4, 40, 12, 2),
    path('M118 16v34', true),
    path('M42 28h76M111 24l7 4-7 4'),
    path('M118 41H42', true)
  ],
  communication: [
    rect(14, 18, 40, 18, 2),
    rect(106, 18, 40, 18, 2),
    path('M54 27h52'),
    path('M68 20h24M88 17l4 3-4 3')
  ],
  timing: [path('M20 6v42h130'), path('M20 38h30V18h40v20h28V18h28')],
  interaction: [
    rect(8, 10, 44, 34, 2),
    path('M8 18h16l4-4v-4'),
    path('M52 27h18'),
    path('M70 27l9-9 9 9-9 9z'),
    path('M88 27h20'),
    rect(108, 10, 44, 34, 2),
    path('M108 18h16l4-4v-4')
  ]
}
