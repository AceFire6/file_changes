// src/main.ts
import core3 from "@actions/core";

// src/file-changes.ts
import core from "@actions/core";
import { getExecOutput } from "@actions/exec";
function getTemplatedGlobs(globTemplate, globs) {
  let templatedGlobs;
  if (typeof globs == "string") {
    templatedGlobs = globTemplate.replace("{glob}", globs);
  } else {
    templatedGlobs = globs.map((glob) => {
      return globTemplate.replace("{glob}", glob);
    }).join(" ");
  }
  return templatedGlobs;
}
async function getFileChangesWithCommand(command) {
  const { exitCode, stdout, stderr } = await getExecOutput(`/bin/bash -c "${command}"`);
  core.debug(`Command result - stdout = ${stdout} and stderr = ${stderr}`);
  if (exitCode !== 0 || stderr !== "") {
    throw new Error(`Failed to get files - Exit Code ${exitCode} - ${stderr}`);
  }
  return stdout.split("\n").map((s) => s.trim()).filter((line) => line !== "");
}
function getFilteredChangeMap(fileChanges, changeFilters) {
  return fileChanges.map((fileChange) => {
    for (const [changeType, lineStart] of Object.entries(changeFilters)) {
      core.debug(
        `Checking - ${changeType} ${lineStart} - ${fileChange} - ${JSON.stringify(lineStart)} ${JSON.stringify(
          fileChange
        )}`
      );
      if (fileChange.startsWith(lineStart)) {
        core.debug(`Matched! - ${changeType} ${lineStart} - ${fileChange}`);
        return [changeType, fileChange.replace(lineStart, "")];
      }
    }
  }).filter((s) => s !== void 0);
}
function parseFileChanges(fileChanges) {
  const fileChangeMap = { ADDED: [], CHANGED: [], DELETED: [] };
  for (const [changeType, parsedFileChange] of fileChanges) {
    fileChangeMap[changeType].push(parsedFileChange);
  }
  return fileChangeMap;
}

// src/utils/inputs.ts
import core2 from "@actions/core";
import * as z from "zod";
var ChangeMapSchema = z.object({
  globs: z.union([z.string(), z.array(z.string())]),
  separateDeleted: z.optional(z.boolean())
});
function splitLabelMapString(splitString, separator) {
  const index = splitString.indexOf(separator);
  const label = splitString.slice(0, Math.max(0, index)).trim();
  const config = splitString.slice(index + 1).trim();
  return [label, config];
}
function parseLabelMapInput(changeMapInput) {
  const parsedLabelMapTuples = [];
  for (const changeInput of changeMapInput) {
    const trimmedInput = changeInput.trim();
    if (trimmedInput.length === 0) {
      continue;
    }
    const splitLabelMap = splitLabelMapString(trimmedInput, ":");
    parsedLabelMapTuples.push(splitLabelMap);
  }
  return parsedLabelMapTuples;
}
function parseChangeMapInput(changeMapInput) {
  const labelMapTuples = parseLabelMapInput(changeMapInput);
  const changeMap = [];
  for (const [label, jsonMap] of labelMapTuples) {
    const parsedInput = JSON.parse(jsonMap);
    const { globs, separateDeleted = false } = ChangeMapSchema.parse(parsedInput);
    changeMap.push({
      label,
      config: { globs, separateDeleted }
    });
  }
  return changeMap;
}
function allowedFilterLabel(label) {
  const allowedFilters = ["ADDED", "CHANGED", "DELETED"];
  const allowedFiltersSet = new Set(allowedFilters);
  return allowedFiltersSet.has(label);
}
function parseFilterPatterns(filterPatternsInput) {
  const labelFilterTuples = parseLabelMapInput(filterPatternsInput);
  const filterPattern = {};
  for (const [label, pattern] of labelFilterTuples) {
    if (!allowedFilterLabel(label)) {
      core2.warning(`Filter label ${label} is not allowed`);
      continue;
    }
    filterPattern[label] = pattern.includes('"') ? JSON.parse(pattern) : pattern;
  }
  return filterPattern;
}
function getInputs() {
  const baseBranchName = core2.getInput("base-branch");
  core2.debug(`Base Branch Name - ${baseBranchName}`);
  let fileChangeFindCommand = core2.getInput("command", { required: false });
  fileChangeFindCommand = fileChangeFindCommand.replace("{branchName}", baseBranchName);
  core2.debug(`Command - ${fileChangeFindCommand}`);
  const globTemplate = core2.getInput("glob-template", { required: false });
  core2.debug(`Glob Template - ${globTemplate}`);
  const filterPatternsInput = core2.getMultilineInput("filter-patterns", {
    required: false
  });
  core2.debug(`Filter Patterns Input - ${filterPatternsInput.join(", ")}`);
  const filterPatterns = parseFilterPatterns(filterPatternsInput);
  const filterPatternsString = Object.entries(filterPatterns).map((s) => s.join(":")).join(",");
  core2.debug(`Change Filters - ${filterPatternsString}`);
  const changeMapInput = core2.getMultilineInput("change-map");
  core2.debug(`Change Map Input - ${changeMapInput.join(", ")}`);
  const changeMap = parseChangeMapInput(changeMapInput);
  return { changeMap, filterPatterns, fileChangeFindCommand, globTemplate };
}

// src/main.ts
async function run() {
  try {
    const { fileChangeFindCommand, globTemplate, changeMap, filterPatterns } = getInputs();
    core3.debug(`Starting ${(/* @__PURE__ */ new Date()).toTimeString()}`);
    let anyFilesChanged = false;
    for (const {
      label,
      config: { globs, separateDeleted }
    } of changeMap) {
      const templatedGlobs = getTemplatedGlobs(globTemplate, globs);
      const fileChangeCommand = fileChangeFindCommand.replace("{globs}", templatedGlobs);
      core3.debug(`[${label}] Generate file change command - ${fileChangeCommand}`);
      const fileChanges = await getFileChangesWithCommand(fileChangeCommand);
      core3.debug(`[${label}] File changes - ${fileChanges.join(", ")}`);
      const filteredChanges = getFilteredChangeMap(fileChanges, filterPatterns);
      core3.debug(`[${label}] Filtered changes - ${filteredChanges.join(", ")}`);
      const {
        ADDED: addedFiles,
        CHANGED: changedFiles,
        DELETED: deletedFiles
      } = parseFileChanges(filteredChanges);
      core3.debug(`[${label}] Parsed changes - ADDED - ${addedFiles.join(", ")}`);
      core3.debug(`[${label}] Parsed changes - CHANGED - ${changedFiles.join(", ")}`);
      core3.debug(`[${label}] Parsed changes - DELETED - ${deletedFiles.join(", ")}`);
      let existingFileChanges = [...addedFiles, ...changedFiles];
      const globChanges = existingFileChanges.length > 0 || deletedFiles.length > 0;
      anyFilesChanged ||= globChanges;
      if (separateDeleted) {
        core3.setOutput(`deleted-${label}`, deletedFiles.join(" "));
      } else {
        existingFileChanges = [...existingFileChanges, ...deletedFiles];
      }
      core3.setOutput(label, existingFileChanges.join(" "));
      core3.setOutput(`any-${label}`, globChanges);
    }
    core3.setOutput(`any-matches`, anyFilesChanged);
    core3.debug(`Finished ${(/* @__PURE__ */ new Date()).toTimeString()}`);
  } catch (error) {
    if (error === null || typeof error !== "string" && typeof error !== "object") {
      core3.setFailed("Unknown error encountered");
      return;
    }
    if (typeof error === "string") {
      core3.setFailed(`Encountered error - ${error}`);
      return;
    }
    if ("message" in error && typeof error.message === "string") {
      core3.setFailed(error.message);
      return;
    }
    core3.setFailed("Unknown error encountered");
  }
}
void run();
//# sourceMappingURL=index.js.map