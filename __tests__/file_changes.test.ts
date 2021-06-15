import {getFileChanges, GitChange} from '../src/file_changes'
import {getExecOutput} from '@actions/exec'
import {mocked} from 'ts-jest/utils'


jest.mock('@actions/exec')
const mockedExec = mocked(getExecOutput, true)
const baseBranch = 'main'


describe('getFileChanges uses GitChange', () => {
  test('uses A\\t for GitChange.ADDED', async () => {
    mockedExec.mockResolvedValue({stdout: '', stderr: '', exitCode: 0})

    await getFileChanges('*.txt', baseBranch, GitChange.ADDED)

    expect(mockedExec).toHaveBeenCalledWith(`/bin/bash -c "git diff --name-status --no-renames ${baseBranch} | grep -E A\t"`)
  })

  test('uses M\\t for GitChange.CHANGED', async () => {
    mockedExec.mockResolvedValue({stdout: '', stderr: '', exitCode: 0})

    await getFileChanges('*.txt', baseBranch, GitChange.CHANGED)

    expect(mockedExec).toHaveBeenCalledWith(`/bin/bash -c "git diff --name-status --no-renames ${baseBranch} | grep -E M\t"`)
  })

  test('uses D\\t for GitChange.DELETED', async () => {
    mockedExec.mockResolvedValue({stdout: '', stderr: '', exitCode: 0})

    await getFileChanges('*.txt', baseBranch, GitChange.DELETED)

    expect(mockedExec).toHaveBeenCalledWith(`/bin/bash -c "git diff --name-status --no-renames ${baseBranch} | grep -E D\t"`)
  })
})
