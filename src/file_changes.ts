import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'
import {FilterPattern} from './utils/inputs'

export enum GitChange {
  ADDED = 'ADDED',
  CHANGED = 'CHANGED',
  DELETED = 'DELETED',
}
export type GitChangeType = typeof GitChange[keyof typeof GitChange]

interface FileChangeMap {
  ADDED: string[]
  CHANGED: string[]
  DELETED: string[]
}
type FilteredChange = [GitChangeType, string]

export async function getTemplatedGlobs(
  globTemplate: string,
  globs: string | string[],
): Promise<string> {
  let templatedGlobs: string

  if (typeof globs == 'string') {
    templatedGlobs = globTemplate.replace('{glob}', globs)
  } else {
    templatedGlobs = globs.reduce((accumulator, glob) => {
      return `${accumulator}${globTemplate.replace('{glob}', glob)}`
    })
  }

  return templatedGlobs
}

export async function getFileChangesWithCommand(command: string): Promise<string[]> {
  const {exitCode, stdout, stderr} = await getExecOutput(`/bin/bash -c "${command}"`)
  core.debug(`Command result - stdout = ${stdout} and stderr = ${stderr}`)

  if (exitCode !== 0 || stderr !== '') {
    throw new Error(`Failed to get files - Exit Code ${exitCode} - ${stderr}`)
  }

  return stdout
    .split('\n')
    .map(s => s.trim())
    .filter(line => line !== '')
}

export function getFilteredChangeMap(
  fileChanges: string[],
  changeFilters: FilterPattern,
): FilteredChange[] {
  return fileChanges
    .map(fileChange => {
      for (const [changeType, lineStart] of Object.entries(changeFilters)) {
        core.debug(
          `Checking - ${changeType} ${lineStart} - ${fileChange} - ${escape(lineStart)} ${escape(
            fileChange,
          )}`,
        )
        if (fileChange.startsWith(lineStart)) {
          core.debug(`Matched! - ${changeType} ${lineStart} - ${fileChange}`)
          return [changeType as GitChangeType, fileChange.replace(lineStart, '')]
        }
      }
    })
    .filter(s => s !== undefined) as FilteredChange[]
}

export async function parseFileChanges(fileChanges: FilteredChange[]): Promise<FileChangeMap> {
  const fileChangeMap = {ADDED: [], CHANGED: [], DELETED: []}

  return fileChanges.reduce((accumulator, [changeType, parsedFileChange]) => {
    return {
      ...accumulator,
      [changeType]: [...accumulator[changeType], parsedFileChange],
    }
  }, fileChangeMap)
}
