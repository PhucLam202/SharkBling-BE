import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node18', 
  clean: true,
  outDir: 'dist',
  external: ['@mysten/walrus-wasm', '@getnimbus/sui-agent-kit']
});
