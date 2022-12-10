import * as process from 'node:process'
import * as cp from 'node:child_process'
import * as path from 'node:path'
import * as fs from 'node:fs'
import tmp from 'tmp'

function regexOutput(fieldName: string, value: string): RegExp {
  return new RegExp(`${fieldName}<<(?<delim>ghadelimiter_.+)\\n${value}\\n\\k<delim>`)
}

describe('test main action', () => {
  let tempTestFileName: string
  const nodePath = process.execPath
  const actionPath = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {env: process.env}

  let githubOutputFilePath = process.env['GITHUB_OUTPUT'] ?? ''

  beforeAll(() => {
    // Create temp file
    const {name} = tmp.fileSync()
    const expected_git_changes = `
      A\tadded_text.txt
      M\tchanged_text.txt
      D\tdeleted_text.txt
      A\tadded_img.png
      M\tchanged_img.png
    `
    // Write expected changes to temp file for subsequent tests
    fs.writeFileSync(name, expected_git_changes)
    tempTestFileName = name

    // Set up environment variables
    process.env['INPUT_BASE-BRANCH'] = tempTestFileName
    process.env['INPUT_FILTER-PATTERNS'] = `
      ADDED: {"pattern": "A\\t"}
      CHANGED: {"pattern": "M\\t"}
      DELETED: {"pattern": "D\\t"}
    `
    process.env['INPUT_COMMAND'] = 'echo \\"$(cat {branchName} | grep {globs})\\"'
    process.env['INPUT_GLOB-TEMPLATE'] = "-e '{glob}'"
    process.env['INPUT_CHANGE-MAP'] = `
      png: {"globs": ".png", "separateDeleted": true}
      txt: {"globs": ".txt", "separateDeleted": true}
      missing: {"globs": ".jpg"}
    `

    if (githubOutputFilePath === '') {
      const tempFile = tmp.fileSync()
      githubOutputFilePath = tempFile.name

      process.env['GITHUB_OUTPUT'] = githubOutputFilePath
    }
  })

  test('test runs does not error', () => {
    let result = cp.execFileSync(nodePath, [actionPath], options).toString()
    result = fs.readFileSync(githubOutputFilePath, 'utf-8')

    const expectedPngOutput = [
      regexOutput('deleted-png', ''),
      regexOutput('png', 'added_img.png changed_img.png'),
      regexOutput('any-png', 'true'),
    ]

    const expectedTxtOutput = [
      regexOutput('deleted-txt', 'deleted_text.txt'),
      regexOutput('txt', 'added_text.txt changed_text.txt'),
      regexOutput('any-txt', 'true'),
    ]

    const expectedMissingOutput = [
      regexOutput('missing', ''),
      regexOutput('any-missing', 'false'),
      regexOutput('any-matches', 'true'),
    ]

    expectedPngOutput.map(expectedOutput => {
      expect(result).toMatch(expectedOutput)
    })

    expectedTxtOutput.map(expectedOutput => {
      expect(result).toMatch(expectedOutput)
    })

    expectedMissingOutput.map(expectedOutput => {
      expect(result).toMatch(expectedOutput)
    })
  })
})
