import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Canonicalize process.cwd() to resolve Windows junctions/OneDrive redirections
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
try {
  const realDir = fs.realpathSync.native ? fs.realpathSync.native(__dirname) : fs.realpathSync(__dirname)
  if (realDir && realDir !== process.cwd()) {
    process.chdir(realDir)
  }
} catch {
  // fallback if realpath cannot be accessed
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})

