import * as core from '@actions/core'

interface ConfigMap {
  glob: string
  separateDeleted?: boolean
}
type ChangeMap = [string, ConfigMap]

interface Inputs {
  changeMap: ChangeMap[]
  fileChangeFindCommand: string
}

async function getConfigInput(
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
      const [glob, separateDeleted] = JSON.parse(config)
      return [fileType, {glob, separateDeleted}]
    })
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

  const changeMap = await getConfigInput('change-map')
  core.debug(`Change Map - ${changeMap}`)

  return {changeMap, fileChangeFindCommand}
}
