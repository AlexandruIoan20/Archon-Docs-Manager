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
      rollupOptions: { input: { index: resolve(__dirname, 'electron/main.ts') } }
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
