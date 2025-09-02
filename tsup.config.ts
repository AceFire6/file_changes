import { defineConfig } from 'tsup';

export default defineConfig({
    entry: { index: 'src/main.ts' },
    format: ['esm'],
    noExternal: [/^.*$/],
    outDir: './dist',
    bundle: true,
    splitting: false,
    sourcemap: true,
    clean: true,
});
