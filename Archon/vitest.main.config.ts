import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

// Main-process tests, run by Electron's own Node (`npm run test:main`) so native
// modules such as better-sqlite3 load with the ABI the app ships with.
export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    globals: false,
    include: ['electron/**/*.test.ts']
  }
})
