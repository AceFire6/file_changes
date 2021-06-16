import {getFileChangesWithCommand} from '../src/file_changes'
import {getExecOutput} from '@actions/exec'
import {mocked} from 'ts-jest/utils'

jest.mock('@actions/exec')
const mockedExec = mocked(getExecOutput, true)
const baseBranch = 'main'
const command = `git diff --name-status --no-renames ${baseBranch} '*.txt'`

describe('test getFileChangesWithCommand', () => {
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
