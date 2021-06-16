import * as core from '@actions/core'

interface ConfigMap {
  glob: string
  separateDeleted?: boolean
}
type ChangeMap = [string, ConfigMap]

export interface FilterPattern {
  ADDED?: string
  CHANGED?: string
  DELETED?: string
}

interface Inputs {
  changeMap: ChangeMap[]
  filterPatterns: FilterPattern
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
      const [label, config] = value.split(':').map(s => s.trim())
      const {glob, separateDeleted} = JSON.parse(config)
      return [label, {glob, separateDeleted}]
    })
}

async function getFilterPatterns(
  name: string,
  options?: core.InputOptions
): Promise<FilterPattern> {
  // Default: ADDED:A\t,CHANGED:M\t,DELETED:D\t
  const filterInput = core.getInput(name, options)
  const filterPatterns: FilterPattern = {}

  return filterInput
    .split(',')
    .map(s => s.split(':'))
    .reduce((accumulator, [label, pattern]) => {
      return {...accumulator, [label]: pattern}
    }, filterPatterns)
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

  const filterPatterns = await getFilterPatterns('filter-patterns', {
    required: false
  })
  core.debug(`Change Filters - ${filterPatterns}`)

  const changeMap = await getChangeMapInput('change-map')
  core.debug(`Change Map - ${changeMap}`)

  return {changeMap, filterPatterns, fileChangeFindCommand}
}
