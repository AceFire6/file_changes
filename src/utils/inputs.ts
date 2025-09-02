import * as core from '@actions/core';
import * as z from 'zod';

type ConfigMap = {
    globs: string | string[];
    separateDeleted: boolean;
};
type ChangeMap = {
    label: string;
    config: ConfigMap;
};

export type FilterPattern = {
    ADDED?: string;
    CHANGED?: string;
    DELETED?: string;
};

type Inputs = {
    changeMap: ChangeMap[];
    filterPatterns: FilterPattern;
    fileChangeFindCommand: string;
    globTemplate: string;
};

const ChangeMapSchema = z.object({
    globs: z.union([z.string(), z.array(z.string())]),
    separateDeleted: z.optional(z.boolean()),
});

export function splitLabelMapString(splitString: string, separator: string): [string, string] {
    const index = splitString.indexOf(separator);

    const label = splitString.slice(0, Math.max(0, index)).trim();
    const config = splitString.slice(index + 1).trim();

    return [label, config];
}

function parseLabelMapInput(changeMapInput: string[]): [string, string][] {
    const parsedLabelMapTuples: [string, string][] = [];

    for (const changeInput of changeMapInput) {
        const trimmedInput = changeInput.trim();
        if (trimmedInput.length === 0) {
            continue;
        }

        const splitLabelMap = splitLabelMapString(trimmedInput, ':');
        parsedLabelMapTuples.push(splitLabelMap);
    }

    return parsedLabelMapTuples;
}

export function parseChangeMapInput(changeMapInput: string[]): ChangeMap[] {
    core.debug(`ChangeMapInput: ${JSON.stringify(changeMapInput)}`);
    const labelMapTuples = parseLabelMapInput(changeMapInput);
    const changeMap: ChangeMap[] = [];

    for (const [label, jsonMap] of labelMapTuples) {
        core.debug(`label=${label} jsonMap=${jsonMap}`);
        const parsedInput = JSON.parse(jsonMap) as unknown;
        const { globs, separateDeleted = false } = ChangeMapSchema.parse(parsedInput);
        changeMap.push({
            label,
            config: { globs, separateDeleted },
        });
    }

    return changeMap;
}

type AllowedFilter = keyof FilterPattern;
function allowedFilterLabel(label: string): label is AllowedFilter {
    const allowedFilters: AllowedFilter[] = ['ADDED', 'CHANGED', 'DELETED'];
    const allowedFiltersSet = new Set(allowedFilters as string[]);

    return allowedFiltersSet.has(label);
}

export function parseFilterPatterns(filterPatternsInput: string[]): FilterPattern {
    const labelFilterTuples = parseLabelMapInput(filterPatternsInput);
    const filterPattern: FilterPattern = {};

    for (const [label, pattern] of labelFilterTuples) {
        if (!allowedFilterLabel(label)) {
            core.warning(`Filter label ${label} is not allowed`);
            continue;
        }

        filterPattern[label] = pattern.includes('"') ? (JSON.parse(pattern) as string) : pattern;
    }

    return filterPattern;
}

export function getInputs(): Inputs {
    const baseBranchName = core.getInput('base-branch');
    core.debug(`Base Branch Name - ${baseBranchName}`);

    let fileChangeFindCommand = core.getInput('command', { required: false });
    // default is `git diff --name-status --no-renames {branchName} -- {globs}`
    fileChangeFindCommand = fileChangeFindCommand.replace('{branchName}', baseBranchName);
    core.debug(`Command - ${fileChangeFindCommand}`);

    const globTemplate = core.getInput('glob-template', { required: false });
    // default is '{glob}'
    core.debug(`Glob Template - ${globTemplate}`);

    const filterPatternsInput = core.getMultilineInput('filter-patterns', {
        required: false,
    });
    core.debug(`Filter Patterns Input - ${filterPatternsInput.join(', ')}`);
    const filterPatterns = parseFilterPatterns(filterPatternsInput);
    const filterPatternsString = Object.entries(filterPatterns)
        .map((s) => s.join(':'))
        .join(',');
    core.debug(`Change Filters - ${filterPatternsString}`);

    const changeMapInput = core.getMultilineInput('change-map');
    core.debug(`Change Map Input - ${changeMapInput.join(', ')}`);
    const changeMap = parseChangeMapInput(changeMapInput);

    return { changeMap, filterPatterns, fileChangeFindCommand, globTemplate };
}
