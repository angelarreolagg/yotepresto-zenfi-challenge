/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Phase 0 has no tests yet — real suites land from Phase 2 onward (CODESTYLE.md §8).
    // Without this, an empty suite makes `pnpm test` exit non-zero on every early commit.
    passWithNoTests: true,
  },
});
