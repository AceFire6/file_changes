import * as core from '@actions/core'

interface ConfigMap {
  glob: string
  separateDeleted?: boolean
}
type ChangeMap = [string, ConfigMap]

export interface ChangeFilter {
  ADDED?: string
  CHANGED?: string
  DELETED?: string
}

interface Inputs {
  changeMap: ChangeMap[]
  changeFilters: ChangeFilter
  fileChangeFindCommand: string
}

async function getChangeMapInput(
  name: string,
  options?: core.InputOptions
): Promise<ChangeMap[]> {
  return core
    .getInput(name, options)
    .split('\n')
    .map(s => s.trim())
    .filter(x => x !== '')
    .map(value => {
      const [fileType, config] = value.split(':').map(s => s.trim())
      const {glob, separateDeleted} = JSON.parse(config)
      return [fileType, {glob, separateDeleted}]
    })
}

async function getChangeFilters(): Promise<ChangeFilter> {
  // Default: ADDED:A\t,CHANGED:M\t,DELETED:D\t
  const filterInput = core.getInput('change-filters', {required: false})
  const changeAccumulator: ChangeFilter = {}
  return filterInput
    .split(',')
    .map(s => s.split(':'))
    .reduce((accumulator, [filterType, lineStart]) => {
      return {...accumulator, [filterType]: lineStart}
    }, changeAccumulator)
}

export async function getInputs(): Promise<Inputs> {
  const baseBranchName = core.getInput('base-branch')
  core.debug(`Base Branch Name - ${baseBranchName}`)

  let fileChangeFindCommand = core.getInput('command', {required: false})
  // default is `git diff --name-status --no-renames {branchName} {glob}`
  fileChangeFindCommand = fileChangeFindCommand.replace(
    '{branchName}',
    baseBranchName
  )
  core.debug(`Command - ${fileChangeFindCommand}`)

  const changeFilters = await getChangeFilters()
  core.debug(`Change Filters - ${changeFilters}`)

  const changeMap = await getChangeMapInput('change-map')
  core.debug(`Change Map - ${changeMap}`)

  return {changeMap, changeFilters, fileChangeFindCommand}
}
