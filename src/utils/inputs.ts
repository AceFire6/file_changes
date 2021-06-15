import * as core from '@actions/core'

type ConfigArray = [string, boolean?]

interface Inputs {
  branchName: string
  changeMap: ConfigArray[]
}

async function getConfigInput(
  name: string,
  options?: core.InputOptions
): Promise<ConfigArray[]> {
  return core
    .getInput(name, options)
    .split('\n')
    .map(s => s.trim())
    .filter(x => x !== '')
    .map(value => {
      const [fileType, config] = value.split(':').map(s => s.trim())
      return [fileType, JSON.parse(config)]
    })
}

export async function getInputs(): Promise<Inputs> {
  const baseBranchName = core.getInput('base branch')
  core.debug(`Base Branch Name - ${baseBranchName}`)

  const changeMap = await getConfigInput('change map')
  core.debug(`Change Map - ${changeMap}`)

  return {branchName: baseBranchName, changeMap}
}
