import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { getInputs, parseChangeMapInput, parseFilterPatterns, splitLabelMapString } from 'src/utils/inputs';

describe('splitLabelMapString', () => {
    test('returns correct label/config tuple', () => {
        const splitChangeMapLine = splitLabelMapString('python_files: {"globs": "*.py", "separateDeleted": true}', ':');

        expect(splitChangeMapLine).toEqual(['python_files', '{"globs": "*.py", "separateDeleted": true}']);
    });
});

describe('parseChangeMapInput', () => {
    test('returns correct value', () => {
        const changeMap = parseChangeMapInput([
            'python_files: {"globs": "*.py", "separateDeleted": true}',
            'requirements: {"globs": "requirements/*.txt"}',
        ]);

        expect(changeMap).toEqual([
            { label: 'python_files', config: { globs: '*.py', separateDeleted: true } },
            {
                label: 'requirements',
                config: { globs: 'requirements/*.txt', separateDeleted: false },
            },
        ]);
    });
});

describe('parseFilterPatterns', () => {
    test('returns correct value', () => {
        const filterPatterns = parseFilterPatterns([
            String.raw`ADDED: "A\t"`,
            String.raw`CHANGED: "M\t"`,
            String.raw`DELETED: "D\t"`,
        ]);

        expect(filterPatterns).toStrictEqual({
            ADDED: 'A\t',
            CHANGED: 'M\t',
            DELETED: 'D\t',
        });
    });
});

describe('getInputs', () => {
    beforeEach(() => {
        vi.stubEnv('INPUT_BASE-BRANCH', 'base_branch');
        vi.stubEnv(
            'INPUT_FILTER-PATTERNS',
            String.raw`
      ADDED: "A\t"
      CHANGED: "M\t"
      DELETED: "D\t"
    `,
        );
        vi.stubEnv('INPUT_COMMAND', "cat {branchName} | grep '{glob}'");
        vi.stubEnv(
            'INPUT_CHANGE-MAP',
            `
      python_files: {"globs": "*.py", "separateDeleted": true}
      requirements: {"globs": "requirements/*.txt"}
    `,
        );
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    test('returns correct values', () => {
        const { fileChangeFindCommand, changeMap, filterPatterns } = getInputs();

        expect(fileChangeFindCommand).toEqual("cat base_branch | grep '{glob}'");

        expect(changeMap).toEqual([
            { label: 'python_files', config: { globs: '*.py', separateDeleted: true } },
            {
                label: 'requirements',
                config: { globs: 'requirements/*.txt', separateDeleted: false },
            },
        ]);

        expect(filterPatterns).toEqual({
            ADDED: 'A\t',
            CHANGED: 'M\t',
            DELETED: 'D\t',
        });
    });
});
