import { z } from 'zod'

/** ISO-8601 timestamp; `Z` or an explicit offset. */
export const isoDate = z.iso.datetime({ offset: true })
