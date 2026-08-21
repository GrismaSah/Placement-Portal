import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
// No `resolve.alias` here on purpose. An '@' -> './src' alias used to be
// configured, but not one import in the codebase ever used it — every import
// is relative — so it was config that had to be explained without buying
// anything. It was also built with `new URL(...).pathname`, which on Windows
// yields a leading-slash path like '/C:/...'; the alias was never exercised,
// so that never surfaced. Removed rather than fixed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
