import * as core from '@actions/core'
import {getAllFileChanges, GitChange, GitChangeType} from './file_changes'

async function run(): Promise<void> {
  try {
    const baseBranchName = core.getInput('base-branch')
    const changeMapJSON = core.getInput('change-map')
    const changeMap = JSON.parse(changeMapJSON)
    if (typeof changeMap !== 'object') {
      core.setFailed('You must provide a JSON map for change-map input')
      return
    }

    const separateDeletesJSON = core.getInput('separate-deletes')
    const separateDeletes = JSON.parse(separateDeletesJSON)
    if (typeof separateDeletes !== 'boolean') {
      core.setFailed('You must provide a boolean for separate-deletes input')
      return
    }

    // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
    core.debug(
      `Parsing ${changeMapJSON} with separate deletes ${separateDeletes} ...`
    )
    core.debug(`Starting ${new Date().toTimeString()}`)

    let anyFilesChanged = false
    for (const fileType of Object.keys(changeMap)) {
      const glob = changeMap.get(fileType)
      const fileChangeMap: Map<
        GitChangeType,
        string[]
      > = await getAllFileChanges(glob, baseBranchName)

      const addedChanges = fileChangeMap.get(GitChange.ADDED) || []
      const changedChanges = fileChangeMap.get(GitChange.CHANGED) || []
      let existingFileChanges = addedChanges.concat(changedChanges)
      const deletedFileChanges = fileChangeMap.get(GitChange.DELETED) || []

      const anyFileTypeFilesChanged =
        !!existingFileChanges.length || !!deletedFileChanges
      anyFilesChanged = anyFilesChanged || anyFileTypeFilesChanged

      if (separateDeletes) {
        core.setOutput(`deleted-${fileType}`, deletedFileChanges)
      } else {
        existingFileChanges = existingFileChanges.concat(deletedFileChanges)
      }

      core.setOutput(fileType, existingFileChanges.join(' '))
      core.setOutput(`any-${fileType}`, anyFileTypeFilesChanged)
    }

    core.setOutput(`any-matches`, anyFilesChanged)
    core.debug(`Finished ${new Date().toTimeString()}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
