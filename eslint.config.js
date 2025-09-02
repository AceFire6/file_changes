import { getEsLintConfig } from '@AceFire6/eslint-config';
import { globalIgnores } from 'eslint/config';

export default getEsLintConfig({
    buildDir: 'dist',
    testDirectory: '__tests__',
    additionalConfig: [
        globalIgnores(['dist/**']),
        {
            files: ['rollup.config.ts'],
            rules: {
                'import-x/no-default-export': 'off',
            },
        },
    ],
});
