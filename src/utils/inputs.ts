import * as core from '@actions/core';

interface ConfigMap {
  globs: string | string[];
  separateDeleted: boolean;
}
interface ChangeMap {
  label: string;
  config: ConfigMap;
}

export interface FilterPattern {
  ADDED?: string;
  CHANGED?: string;
  DELETED?: string;
}

interface Inputs {
  changeMap: ChangeMap[];
  filterPatterns: FilterPattern;
  fileChangeFindCommand: string;
  globTemplate: string;
}

function splitLabelMapString(splitString: string, separator: string): [string, string] {
  const index = splitString.indexOf(separator);

  const label = splitString.substring(0, index).trim();
  const config = splitString.substr(index + 1).trim();

  return [label, config];
}

async function parseLabelMapInput(changeMapInput: string[]): Promise<[string, string][]> {
  return changeMapInput
    .map(s => s.trim())
    .filter(x => x !== '')
    .map(value => splitLabelMapString(value, ':'));
}

async function parseChangeMapInput(changeMapInput: string[]): Promise<ChangeMap[]> {
  return (await parseLabelMapInput(changeMapInput)).map(([label, jsonMap]) => {
    const { globs, separateDeleted = false } = JSON.parse(jsonMap);
    return { label, config: { globs, separateDeleted } };
  });
}

async function parseFilterPatterns(filterPatternsInput: string[]): Promise<FilterPattern> {
  return (await parseLabelMapInput(filterPatternsInput))
    .map(([label, patternMap]) => {
      const { pattern } = JSON.parse(patternMap);
      return [label, pattern];
    })
    .reduce((accumulator, [label, pattern]) => {
      return { ...accumulator, [label]: pattern };
    }, {}) as FilterPattern;
}

export async function getInputs(): Promise<Inputs> {
  const baseBranchName = core.getInput('base-branch');
  core.debug(`Base Branch Name - ${baseBranchName}`);

  let fileChangeFindCommand = core.getInput('command', { required: false });
  // default is `git diff --name-status --no-renames {branchName} {globs}`
  fileChangeFindCommand = fileChangeFindCommand.replace('{branchName}', baseBranchName);
  core.debug(`Command - ${fileChangeFindCommand}`);

  const globTemplate = core.getInput('glob-template', { required: false });
  // default is '{glob}'
  core.debug(`Glob Template - ${globTemplate}`);

  const filterPatternsInput = core.getMultilineInput('filter-patterns', {
    required: false,
  });
  core.debug(`Filter Patterns Input - ${filterPatternsInput}`);
  const filterPatterns = await parseFilterPatterns(filterPatternsInput);
  const filterPatternsStr = Object.entries(filterPatterns)
    .map(s => s.join(':'))
    .join(',');
  core.debug(`Change Filters - ${filterPatternsStr}`);

  const changeMapInput = core.getMultilineInput('change-map');
  core.debug(`Change Map Input - ${changeMapInput}`);
  const changeMap = await parseChangeMapInput(changeMapInput);

  return { changeMap, filterPatterns, fileChangeFindCommand, globTemplate };
}
