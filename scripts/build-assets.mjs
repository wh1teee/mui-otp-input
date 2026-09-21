import { copyFile, mkdir } from 'node:fs/promises'

await mkdir(new URL('../dist/', import.meta.url), { recursive: true })
await copyFile(
  new URL('../src/shadcn.css', import.meta.url),
  new URL('../dist/shadcn.css', import.meta.url)
)
