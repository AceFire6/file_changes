import {
  getAllFileChanges,
  getFileChanges,
  GitChange,
  GitChangeType
} from '../src/file_changes'
import {getExecOutput} from '@actions/exec'
import {mocked} from 'ts-jest/utils'

jest.mock('@actions/exec')
const mockedExec = mocked(getExecOutput, true)
const baseBranch = 'main'

describe('getFileChanges uses GitChange', () => {
  test('uses A\\t for GitChange.ADDED', async () => {
    mockedExec.mockResolvedValue({stdout: '', stderr: '', exitCode: 0})

    await getFileChanges('*.txt', baseBranch, GitChange.ADDED)

    expect(mockedExec).toHaveBeenCalledWith(
      `/bin/bash -c "git diff --name-status --no-renames ${baseBranch} | grep -E A\t"`
    )
  })

  test('uses M\\t for GitChange.CHANGED', async () => {
    mockedExec.mockResolvedValue({stdout: '', stderr: '', exitCode: 0})

    await getFileChanges('*.txt', baseBranch, GitChange.CHANGED)

    expect(mockedExec).toHaveBeenCalledWith(
      `/bin/bash -c "git diff --name-status --no-renames ${baseBranch} | grep -E M\t"`
    )
  })

  test('uses D\\t for GitChange.DELETED', async () => {
    mockedExec.mockResolvedValue({stdout: '', stderr: '', exitCode: 0})

    await getFileChanges('*.txt', baseBranch, GitChange.DELETED)

    expect(mockedExec).toHaveBeenCalledWith(
      `/bin/bash -c "git diff --name-status --no-renames ${baseBranch} | grep -E D\t"`
    )
  })
})

describe('getAllFileChanges', () => {
  test('returns a map', async () => {
    mockedExec.mockResolvedValue({stdout: '', stderr: '', exitCode: 0})

    const result = await getAllFileChanges('*.txt', baseBranch)

    expect(result).toBeInstanceOf(Map)
  })

  test('returns files correctly mapped', async () => {
    const gitAddedFiles = 'A\tadded_file1.txt\nA\tadded_file2.txt\n'
    const gitChangedFiles = 'M\tchanged_file1.txt\nM\tchanged_file2.txt\n'
    const gitDeletedFiles = 'D\tdeleted_file1.txt\nD\tdeleted_file2.txt\n'

    mockedExec
      .mockResolvedValueOnce({stdout: gitAddedFiles, stderr: '', exitCode: 0})
      .mockResolvedValueOnce({stdout: gitChangedFiles, stderr: '', exitCode: 0})
      .mockResolvedValue({stdout: gitDeletedFiles, stderr: '', exitCode: 0})

    const result = await getAllFileChanges('*.txt', baseBranch)
    const expectedResults: [GitChangeType, string[]][] = [
      [GitChange.ADDED, ['added_file1.txt', 'added_file2.txt']],
      [GitChange.CHANGED, ['changed_file1.txt', 'changed_file2.txt']],
      [GitChange.DELETED, ['deleted_file1.txt', 'deleted_file2.txt']]
    ]

    expect(result).toEqual(new Map<GitChangeType, string[]>(expectedResults))
  })
})
