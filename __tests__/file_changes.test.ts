import {
  getChangeTypeMap,
  getFileChangesWithCommand,
  GitChange
} from '../src/file_changes'
import {getExecOutput} from '@actions/exec'
import {mocked} from 'ts-jest/utils'

jest.mock('@actions/exec')

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
      exitCode: 0
    })

    const result = await getFileChangesWithCommand(command)

    expect(result).toEqual(['A', 'B', 'C'])
  })

  test('throws error on error code other than 0', async () => {
    mockedExec.mockResolvedValue({stdout: '', stderr: '', exitCode: 1})

    await expect(getFileChangesWithCommand(command)).rejects.toThrow(
      new Error('Failed to get files - Exit Code 1 - ')
    )
  })

  test('throws error if anything written to stderr', async () => {
    const stderr = 'Mistakes were made!'
    mockedExec.mockResolvedValue({stdout: '', stderr, exitCode: 0})

    await expect(getFileChangesWithCommand(command)).rejects.toThrow(
      new Error(`Failed to get files - Exit Code 0 - ${stderr}`)
    )
  })
})

describe('test getChangeTypeMap', () => {
  const changeFilters = {ADDED: 'A\t', CHANGED: 'M\t', DELETED: 'D\t'}

  test.concurrent.each([GitChange.ADDED, GitChange.CHANGED, GitChange.DELETED])(
    'returns correct mapping for %s file line',
    async gitChange => {
      const filter = changeFilters[gitChange]
      const fileChange = `${filter}${gitChange.toLowerCase()}_file1.txt`

      const result = await getChangeTypeMap(fileChange, changeFilters)
      const expectedFileChange = fileChange.replace(filter, '')

      expect(result).toEqual([gitChange, expectedFileChange])
    }
  )
})
