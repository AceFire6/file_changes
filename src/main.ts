import * as core from '@actions/core'
import {getAllFileChanges, GitChange, GitChangeType} from './file_changes'

async function run(): Promise<void> {
  try {
    const baseBranchName = core.getInput('base branch')
    core.debug(`Base Branch Name - ${baseBranchName}`)

    const changeMapJSON = core.getInput('change map')
    core.debug(`Change Map - ${changeMapJSON}`)

    const changeMap = JSON.parse(changeMapJSON)
    if (typeof changeMap !== 'object') {
      core.setFailed('You must provide a JSON map for change-map input')
      return
    }

    const separateDeletesJSON = core.getInput('separate deletes', {
      required: false
    })
    core.debug(`Separate Deletes - ${separateDeletesJSON}`)
    const separateDeletes = JSON.parse(separateDeletesJSON)
    if (typeof separateDeletes !== 'boolean') {
      core.setFailed('You must provide a boolean for separate-deletes input')
      return
    }

    core.debug(
      `Parsing ${changeMapJSON} with separate deletes ${separateDeletes} ...`
    )
    core.debug(`Starting ${new Date().toTimeString()}`)

    let anyFilesChanged = false
    for (const fileType of Object.keys(changeMap)) {
      const glob = changeMap[fileType]
      const fileChangeMap = await getAllFileChanges(glob, baseBranchName)

      const addedChanges = fileChangeMap.get(GitChange.ADDED) || []
      const changedChanges = fileChangeMap.get(GitChange.CHANGED) || []
      let existingFileChanges = addedChanges.concat(changedChanges)
      const deletedFileChanges = fileChangeMap.get(GitChange.DELETED) || []

      const anyFileTypeFilesChanged =
        !!existingFileChanges.length || !!deletedFileChanges.length
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
