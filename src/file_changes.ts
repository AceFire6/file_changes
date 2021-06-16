import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'
import {FilterPattern} from './utils/inputs'

export const GitChange = {
  ADDED: 'ADDED',
  CHANGED: 'CHANGED',
  DELETED: 'DELETED'
} as const
export type GitChangeType = typeof GitChange[keyof typeof GitChange]

interface FileChangeMap {
  ADDED: string[]
  CHANGED: string[]
  DELETED: string[]
}

export async function getFileChangesWithCommand(
  command: string
): Promise<string[]> {
  const {exitCode, stdout, stderr} = await getExecOutput(
    `/bin/bash -c "${command}"`
  )
  core.debug(`stdout = ${stdout} and stderr = ${stderr}`)

  if (exitCode !== 0 || stderr !== '') {
    throw new Error(`Failed to get files - Exit Code ${exitCode} - ${stderr}`)
  }

  return stdout
    .split('\n')
    .map(s => s.trim())
    .filter(line => line !== '')
}

function getChangeTypeMap(
  fileChange: string,
  changeFilters: FilterPattern
): [GitChangeType, string] | undefined {
  for (const [changeType, lineStart] of Object.entries(changeFilters)) {
    if (fileChange.startsWith(lineStart)) {
      return [changeType as GitChangeType, fileChange.replace(lineStart, '')]
    }
  }
}

export async function parseFileChanges(
  fileChanges: string[],
  changeFilters: FilterPattern
): Promise<FileChangeMap> {
  const fileChangeMap = {ADDED: [], CHANGED: [], DELETED: []}

  return fileChanges.reduce((accumulator, fileChange) => {
    const changeTypeMap = getChangeTypeMap(fileChange, changeFilters)
    if (typeof changeTypeMap === 'undefined') {
      return accumulator
    }

    const [changeType, parsedFileChange] = changeTypeMap
    return {
      ...accumulator,
      [changeType]: [...accumulator[changeType], parsedFileChange]
    }
  }, fileChangeMap)
}
