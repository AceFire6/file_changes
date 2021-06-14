import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'

export const GitChange = {
  ADDED: 'ADDED',
  CHANGED: 'CHANGED',
  DELETED: 'DELETED'
} as const
export type GitChangeType = typeof GitChange[keyof typeof GitChange]

async function getFileChanges(
  fileGlob: string,
  baseBranch: string,
  changeType: GitChangeType
): Promise<string[]> {
  let grepKey: string
  if (changeType === GitChange.ADDED) {
    grepKey = 'A\t'
  } else if (changeType === GitChange.CHANGED) {
    grepKey = 'M\t'
  } else {
    grepKey = 'D\t'
  }

  const gitCommand = `git diff --name-status --no-renames ${baseBranch}`
  const grepCommand = `grep -E ${grepKey}`

  const {stdout: stdout, stderr: stderr} = await getExecOutput(
    `/bin/bash -c "${gitCommand} | ${grepCommand}"`
  )
  core.debug(`stdout = ${stdout} and stderr = ${stderr}`)

  if (stderr !== '') {
    throw new Error(`Failed to get files - ${stderr}`)
  }

  return stdout.split('\n').map(value => {
    return value.replace(grepKey, '')
  })
}

export async function getAllFileChanges(
  fileGlob: string,
  baseBranch: string
): Promise<Map<GitChangeType, string[]>> {
  const fileMap = new Map<GitChangeType, string[]>()

  for (const [, changeType] of Object.entries(GitChange)) {
    core.debug(`Look for ${changeType} globs ${fileGlob}`)

    const addedFiles = await getFileChanges(fileGlob, baseBranch, changeType)
    fileMap.set(changeType, addedFiles)

    core.debug(`Found ${changeType} ${addedFiles}`)
  }

  return fileMap
}
