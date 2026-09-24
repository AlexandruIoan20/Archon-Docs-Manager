import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `@` points at the renderer source root. The main/preload builds share the alias
// so they can import the IPC contract types from src/core/types.
const alias = { '@': resolve(__dirname, 'src') }

export default defineConfig({
  main: {
    resolve: { alias },
    build: {
      // chokidar 5 is ESM-only while main is emitted as CJS, so it is bundled.
      // better-sqlite3 is a native module and must stay external (plan 10).
      externalizeDeps: { exclude: ['chokidar'] },
      rollupOptions: {
        input: { index: resolve(__dirname, 'electron/main.ts') },
        external: ['better-sqlite3']
      }
    }
  },
  preload: {
    resolve: { alias },
    build: {
      rollupOptions: { input: { index: resolve(__dirname, 'electron/preload.ts') } }
    }
  },
  renderer: {
    root: __dirname,
    resolve: { alias },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: { input: { index: resolve(__dirname, 'index.html') } }
    }
  }
})
