import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node20',
  clean: true,
  dts: false,
  external: ['express', 'cors', '@mysten/walrus-wasm']
});
