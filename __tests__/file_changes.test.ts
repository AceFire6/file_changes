import {
  getFilteredChangeMap,
  getFileChangesWithCommand,
  GitChange,
  parseFileChanges,
  GitChangeType,
  getTemplatedGlobs,
} from '../src/file_changes'
import {getExecOutput} from '@actions/exec'
import {mocked} from 'ts-jest/utils'

jest.mock('@actions/exec')

describe('test getTemplatedGlobs', () => {
  const globTemplate = "'{glob}'"

  test('returns correctly templated globs for array', async () => {
    const globs = ['*.png', '*.txt']

    const result = await getTemplatedGlobs(globTemplate, globs)

    expect(result).toEqual("'*.png' '*.txt'")
  })

  test('returns correctly templated globs for string', async () => {
    const globs = '*.txt'

    const result = await getTemplatedGlobs(globTemplate, globs)

    expect(result).toEqual("'*.txt'")
  })
})

describe('test getFileChangesWithCommand', () => {
  const mockedExec = mocked(getExecOutput, true)
  const baseBranch = 'main'
  const command = `git diff --name-status --no-renames ${baseBranch} '*.txt'`

  test('makes the correct exec call', async () => {
    mockedExec.mockResolvedValue({stdout: '', stderr: '', exitCode: 0})

    await getFileChangesWithCommand(command)

    expect(mockedExec).toHaveBeenCalledWith(`/bin/bash -c "${command}"`)
  })

  test('makes the correct exec call', async () => {
    mockedExec.mockResolvedValue({
      stdout: ' A\n B\n C ',
      stderr: '',
      exitCode: 0,
    })

    const result = await getFileChangesWithCommand(command)

    expect(result).toEqual(['A', 'B', 'C'])
  })

  test('throws error on error code other than 0', async () => {
    mockedExec.mockResolvedValue({stdout: '', stderr: '', exitCode: 1})

    await expect(getFileChangesWithCommand(command)).rejects.toThrow(
      new Error('Failed to get files - Exit Code 1 - '),
    )
  })

  test('throws error if anything written to stderr', async () => {
    const stderr = 'Mistakes were made!'
    mockedExec.mockResolvedValue({stdout: '', stderr, exitCode: 0})

    await expect(getFileChangesWithCommand(command)).rejects.toThrow(
      new Error(`Failed to get files - Exit Code 0 - ${stderr}`),
    )
  })
})

describe('test getFilteredChangeMap', () => {
  const changeFilters = {ADDED: 'A\t', CHANGED: 'M\t', DELETED: 'D\t'}

  test.concurrent.each([GitChange.ADDED, GitChange.CHANGED, GitChange.DELETED])(
    'returns correct mapping for %s file line',
    async gitChange => {
      const filter = changeFilters[gitChange]
      const fileChange = `${filter}${gitChange.toLowerCase()}_file1.txt`

      const result = getFilteredChangeMap([fileChange], changeFilters)
      const expectedFileChange = fileChange.replace(filter, '')

      expect(result).toEqual([[gitChange, expectedFileChange]])
    },
  )

  test('returns correct mapping for multiple inputs', async () => {
    const fileChanges = [
      'A\tadded_file.txt',
      'D\tdeleted_file.txt',
      'R098\trenamed.txt',
      'M\tchanged_file.txt',
    ]

    const result = getFilteredChangeMap(fileChanges, changeFilters)
    const expectedResults = [
      [GitChange.ADDED, 'added_file.txt'],
      [GitChange.DELETED, 'deleted_file.txt'],
      [GitChange.CHANGED, 'changed_file.txt'],
    ]

    expect(result).toEqual(expectedResults)
  })

  test('returns empty list if no match is found', async () => {
    const result = getFilteredChangeMap(['ZZ\tfile.txt'], changeFilters)

    expect(result).toEqual([])
  })
})

describe('test parseFileChanges', () => {
  test('returns empty mapping for empty input', async () => {
    const result = await parseFileChanges([])

    expect(result).toEqual({ADDED: [], CHANGED: [], DELETED: []})
  })

  test('returns correct mapping for input', async () => {
    const inputs: [GitChangeType, string][] = [
      [GitChange.ADDED, 'added_file.txt'],
      [GitChange.DELETED, 'deleted_file.txt'],
      [GitChange.CHANGED, 'changed_file.txt'],
    ]
    const result = await parseFileChanges(inputs)

    const expectedResult = {
      ADDED: ['added_file.txt'],
      CHANGED: ['changed_file.txt'],
      DELETED: ['deleted_file.txt'],
    }

    expect(result).toEqual(expectedResult)
  })
})
