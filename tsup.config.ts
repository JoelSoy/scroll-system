import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs', 'esm'],
  // DTS is generated separately by tsc for better CI compatibility
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['react', 'react-dom', 'zustand'],
});
