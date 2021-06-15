import * as core from '@actions/core'

interface ConfigMap {
  glob: string
  separateDeleted?: boolean
}
type ChangeMap = [string, ConfigMap]

interface Inputs {
  branchName: string
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

  const fileChangeFindCommand = core.getInput('command', {required: false})
  core.debug(`Command - ${fileChangeFindCommand}`)

  const changeMap = await getConfigInput('change-map')
  core.debug(`Change Map - ${changeMap}`)

  return {branchName: baseBranchName, changeMap, fileChangeFindCommand}
}
