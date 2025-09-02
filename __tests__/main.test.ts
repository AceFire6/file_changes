import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import tmp from 'tmp';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

function regexOutput(fieldName: string, value: string): RegExp {
    return new RegExp(`${fieldName}<<(?<delim>ghadelimiter_.+)\\n${value}\\n\\k<delim>`);
}

describe('main action', () => {
    let temporaryTestFileName: string;
    const nodePath = process.execPath;
    const actionPath = path.join(__dirname, '..', 'dist', 'index.js');
    const options: childProcess.ExecFileSyncOptions = { env: process.env };

    let githubOutputFilePath = process.env['GITHUB_OUTPUT'] ?? '';

    beforeAll(() => {
        // Create temp file
        const { name } = tmp.fileSync();
        const expected_git_changes = `
      A\tadded_text.txt
      M\tchanged_text.txt
      D\tdeleted_text.txt
      A\tadded_img.png
      M\tchanged_img.png
    `;
        // Write expected changes to temp file for subsequent tests
        fs.writeFileSync(name, expected_git_changes);
        temporaryTestFileName = name;

        // Set up environment variables
        vi.stubEnv('INPUT_BASE-BRANCH', temporaryTestFileName);
        vi.stubEnv(
            'INPUT_FILTER-PATTERNS',
            `
      ADDED: "A\\t"
      CHANGED: "M\\t"
      DELETED: "D\\t"
    `,
        );
        vi.stubEnv('INPUT_COMMAND', String.raw`echo \"$(cat {branchName} | grep {globs})\"`);
        vi.stubEnv('INPUT_GLOB-TEMPLATE', "-e '{glob}'");
        vi.stubEnv(
            'INPUT_CHANGE-MAP',
            `
      png: {"globs": ".png", "separateDeleted": true}
      txt: {"globs": ".txt", "separateDeleted": true}
      missing: {"globs": ".jpg"}
    `,
        );

        if (githubOutputFilePath === '') {
            const temporaryFile = tmp.fileSync();
            githubOutputFilePath = temporaryFile.name;

            vi.stubEnv('GITHUB_OUTPUT', githubOutputFilePath);
        }
    });

    afterAll(() => {
        vi.unstubAllEnvs();
    });

    test('runs does not error', () => {
        let result = childProcess.execFileSync(nodePath, [actionPath], options).toString();
        result = fs.readFileSync(githubOutputFilePath, 'utf8');

        const expectedPngOutput = [
            regexOutput('deleted-png', ''),
            regexOutput('png', 'added_img.png changed_img.png'),
            regexOutput('any-png', 'true'),
        ];

        const expectedTxtOutput = [
            regexOutput('deleted-txt', 'deleted_text.txt'),
            regexOutput('txt', 'added_text.txt changed_text.txt'),
            regexOutput('any-txt', 'true'),
        ];

        const expectedMissingOutput = [
            regexOutput('missing', ''),
            regexOutput('any-missing', 'false'),
            regexOutput('any-matches', 'true'),
        ];

        expectedPngOutput.map((expectedOutput) => {
            expect(result).toMatch(expectedOutput);
        });

        expectedTxtOutput.map((expectedOutput) => {
            expect(result).toMatch(expectedOutput);
        });

        expectedMissingOutput.map((expectedOutput) => {
            expect(result).toMatch(expectedOutput);
        });
    });
});
