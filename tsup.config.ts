import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/main.ts' },
    format: ['esm'],
    outDir: './dist',
    bundle: true,
    splitting: false,
    sourcemap: true,
    clean: true,
});
