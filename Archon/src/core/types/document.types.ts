import type { z } from 'zod'
import type { documentFileSchema, tiptapDocSchema } from '@/core/schemas/document.schema'

/** A `.ardoc` file as read from disk (defaults applied). */
export type SoarDocument = z.infer<typeof documentFileSchema>
export type TiptapDoc = z.infer<typeof tiptapDocSchema>
