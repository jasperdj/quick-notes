import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  base: process.env.VITE_BASE_PATH || '/folded/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    open: true
  }
})
