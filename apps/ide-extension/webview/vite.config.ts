import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const webviewRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: webviewRoot,
  build: {
    outDir: resolve(webviewRoot, 'dist'),
    emptyOutDir: true,
  },
});
