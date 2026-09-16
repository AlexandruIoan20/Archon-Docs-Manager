/// <reference types="vite/client" />

import type { SoarApi } from '@/core/types'

declare global {
  interface Window {
    // Optional: absent in unit tests and if the preload script fails to load.
    soar?: SoarApi
  }
}
