import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    /**
     * Module tests live beside the code they cover rather than in `tests/`.
     * A module is meant to be self-contained — moving one should not mean
     * hunting for its tests in a parallel tree.
     */
    include: ['tests/int/**/*.int.spec.ts', 'src/modules/**/*.spec.ts'],
  },
})
