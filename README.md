# Git File Change Filter
[![GitHub Action Badge](https://github.com/AceFire6/changed_file_filter/actions/workflows/test.yml/badge.svg)](https://github.com/AceFire6/changed_file_filter/actions/workflztows/test.yml/badge.svg)

## Using the Action

---

### Inputs
```yaml
base-branch:
  required: false
  description: 'The name of the branch being compared to. Uses $GITHUB_BASE_REF if not set'
  default: $GITHUB_BASE_REF

command:
  required: false
  description: 'The command to run to get the file changes can contain {glob} and {branchName} to specify replacements'
  default: 'git diff --name-status --no-renames {branchName} {glob}'

filter-patterns:
  required: false
  description: >-
    A map with keys ADDED, CHANGED, and DELETED as keys and the pattern as a value.
    Any defined keys will be kept, others discarded.
    The matching is done by checking if the file change starts with the pattern.
  default: |
    ADDED: {"pattern": "A\t"}
    CHANGED: {"pattern": "M\t"}
    DELETED: {"pattern": "D\t"}

change-map:
  required: true
  description: >-
    A multi-line map of changes to find.
    eg. python_files: {"glob": "*.py", "separateDeleted": false}
    requirements: {"glob": "requirements/*.txt"}
    The final boolean determines if we separate out floats
```

eg. For a Python project where you want a list of Python files changed with and without deleted files
```yaml
uses: AceFire6/changed_file_filter@v1
with:
  change-map: |
    python: {glob: "*.py", separateDeleted: true}
    requirements: {glob: "requirements/*.txt"}
    migrations: {glob: "**/migrations/*.py"}
```

### Outputs
```yaml
any-matches:
  description: 'Any glob matches found'

# one set of outputs for each entry in change-map
<change-map.0.0>: '<file_changed1> <file_changed2> ...'
# Value set to make boolean checks simpler - 'true' or 'false'
# 'false' if there were no changes found
any-<change-map.0.0>: 'true'
# If separate deletes key is true
deleted-<change-map.0.0>: '<file_deleted1> <file_deleted2> ...'
```

eg. Referring back to the inputs example of a Python project. 
The is what the outputs would look like assuming the following:

* Added files: `tests/test.py`
* Changed files: `main.py` `helpers/utils.py` `requirements/api.txt`
* Deleted files: `utils.py` `requirements/aip.txt`

```yaml
any-matches: 'true'
python: 'tests/test.py main.py helpers/utils.py'
any-python: 'true'
deleted-python: 'utils.py'
requirements: 'requirements/api.txt requirements/aip.txt'
any-requirements: 'true'
migrations: ''
any-migrations: 'false'
```

## Developing

---

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

### Install the dependencies  
```bash
$ npm install
```

### Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

### Run the tests  
```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

### Change action.yml

The action.yml contains defines the inputs and output for your action.

Update the action.yml with your name, description, inputs and outputs for your action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

### Change the Code

Most toolkit and CI/CD operations involve async operations so the action is run in an async function.

```javascript
import * as core from '@actions/core';
...

async function run() {
  try { 
      ...
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

### Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder. 

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket: 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

### Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action
