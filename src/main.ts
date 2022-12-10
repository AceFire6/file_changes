import * as core from '@actions/core'
import {
  getFileChangesWithCommand,
  getFilteredChangeMap,
  getTemplatedGlobs,
  parseFileChanges,
} from './file-changes'
import {getInputs} from './utils/inputs'

async function run(): Promise<void> {
  try {
    // Get Inputs
    const {fileChangeFindCommand, globTemplate, changeMap, filterPatterns} = await getInputs()
    core.debug(`Starting ${new Date().toTimeString()}`)

    // Get & then process files
    let anyFilesChanged = false
    for (const {
      label,
      config: {globs, separateDeleted},
    } of changeMap) {
      // Get globs templated
      const templatedGlobs = await getTemplatedGlobs(globTemplate, globs)
      // Generate command to get files for current glob
      const fileChangeCommand = fileChangeFindCommand.replace('{globs}', templatedGlobs)
      core.debug(`[${label}] Generate file change command - ${fileChangeCommand}`)
      // Get files for glob
      const fileChanges = await getFileChangesWithCommand(fileChangeCommand)
      core.debug(`[${label}] File changes - ${fileChanges}`)

      // Parse fileChanges into list of tuples with ChangeType and filtered name
      const filteredChanges = getFilteredChangeMap(fileChanges, filterPatterns)
      core.debug(`[${label}] Filtered changes - ${filteredChanges}`)

      // Group the file list into ADDED, CHANGED, and DELETE files
      const {
        ADDED: addedFiles,
        CHANGED: changedFiles,
        DELETED: deletedFiles,
      } = await parseFileChanges(filteredChanges)
      core.debug(`[${label}] Parsed changes - ADDED - ${addedFiles}`)
      core.debug(`[${label}] Parsed changes - CHANGED - ${changedFiles}`)
      core.debug(`[${label}] Parsed changes - DELETED - ${deletedFiles}`)

      // Group ADDED & CHANGED - these files can still be operated on directly
      let existingFileChanges = addedFiles.concat(changedFiles)
      // Check if there are any changes in ADDED, CHANGED, or DELETED
      const globChanges = !!existingFileChanges.length || !!deletedFiles.length
      // Figure out if we have had any file changes at all
      anyFilesChanged ||= globChanges

      if (separateDeleted) {
        // If we must separate deleted, we do
        core.setOutput(`deleted-${label}`, deletedFiles.join(' '))
      } else {
        // If we don't need to separate deleted we add them to
        // the existing group of ADDED & CHANGED
        existingFileChanges = existingFileChanges.concat(deletedFiles)
      }

      // Set the plain output
      core.setOutput(label, existingFileChanges.join(' '))
      // Set the boolean flag to indicate any changes were found for this label
      core.setOutput(`any-${label}`, globChanges)
    }

    // Set the boolean flag to indicate that at least one
    // of the labels had a match
    core.setOutput(`any-matches`, anyFilesChanged)
    core.debug(`Finished ${new Date().toTimeString()}`)
  } catch (error: unknown) {
    if (error === null || (typeof error !== 'string' && typeof error !== 'object')) {
      core.setFailed('Unknown error encountered')
      return
    }

    if (typeof error === 'string') {
      core.setFailed(`Encountered error - ${error}`)
      return
    }

    if ('message' in error && typeof error.message === 'string') {
      core.setFailed(error.message)
      return
    }

    core.setFailed('Unknown error encountered')
  }
}

void run()
