import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node20',
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
  },
  noExternal: [/.*/],
  clean: true,
  dts:false
});