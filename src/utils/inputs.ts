import * as core from '@actions/core'

interface ConfigMap {
  glob: string
  separateDeleted?: boolean
}
interface ChangeMap {
  label: string
  config: ConfigMap
}

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

function splitChangeMapString(
  splitString: string,
  separator: string
): [string, string] {
  const index = splitString.indexOf(separator)

  const label = splitString.substring(0, index).trim()
  const config = splitString.substr(index + 1).trim()

  return [label, config]
}

async function getChangeMapInput(): Promise<ChangeMap[]> {
  return core
    .getInput('change-map')
    .split('\n')
    .map(s => s.trim())
    .filter(x => x !== '')
    .map(value => {
      const [label, config] = splitChangeMapString(value, ':')
      const {glob, separateDeleted} = JSON.parse(config)
      return {label, config: {glob, separateDeleted}}
    })
}

async function getFilterPatterns(): Promise<FilterPattern> {
  // Default: '{ADDED:"A\t",CHANGED:"M\t",DELETED:"D\t"}'
  const filterInput = core.getInput('filter-patterns', {required: false})
  const filterPatterns: FilterPattern = JSON.parse(filterInput)
  if (typeof filterPatterns !== 'object') {
    throw new Error('filter-pattern must be a valid JSON object')
  }

  return filterPatterns
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

  const filterPatterns = await getFilterPatterns()
  core.debug(`Change Filters - ${filterPatterns}`)

  const changeMap = await getChangeMapInput()
  core.debug(`Change Map - ${changeMap}`)

  return {changeMap, filterPatterns, fileChangeFindCommand}
}
