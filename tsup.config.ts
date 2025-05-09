import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node18', 
  clean: true,
  outDir: 'dist',
  external: ['@mysten/walrus-wasm']
});
