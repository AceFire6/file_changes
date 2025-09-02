# Git File Change Filter

[![GitHub Action Badge](https://github.com/AceFire6/file_changes/actions/workflows/test.yml/badge.svg)](https://github.com/AceFire6/file_changes/actions/workflows/test.yml/badge.svg)

## Using the Action

---

### Inputs

```yaml
base-branch:
    required: false
    description: 'The name of the branch being compared to. Uses $GITHUB_BASE_REF if not set'
    default: ${{ github.base_ref }}

command:
    required: false
    description: 'The command to run to get the file changes can contain {glob} and {branchName} to specify replacements'
    default: 'git diff --name-status --no-renames {branchName} -- {glob}'

glob-template:
    required: false
    description: 'How to format the globs received'
    default: "'{glob}'"

filter-patterns:
    required: false
    description: >-
        A map with keys ADDED, CHANGED, and DELETED as keys and a pattern as a value.
        The matching is done by checking if the file change starts with the pattern.
    default: |
        ADDED: "A\t"
        CHANGED: "M\t"
        DELETED: "D\t"

change-map:
    required: true
    description: >-
        A multi-line map of changes to find. Each input in the change-map has two (or three with separateDeleted set to true)
        corresponding outputs.
        For a given key in change-map `code` there will be outputs `code`, a list of all the changed files, `any-code`,
        a boolean indicating if there were any changes that matched the glob filters, and `deleted-code` if `separateDeleted` is true.
        eg. python_files: {"globs": "*.py", "separateDeleted": false}
        requirements: {"globs": "requirements/*.txt"}
        py_and_requirements: {"globs": ["requirements/*.txt", "*.py"]}
        The separateDeleted boolean determines if we separate out deleted files or if they're included in the change list.
```

eg. For a Python project where you want a list of Python files changed with and without deleted files

```yaml
uses: AceFire6/file_changes@v0.1.0
with:
    change-map: |
        python: {"globs": "*.py", "separateDeleted": true}
        requirements: {"globs": "requirements/*.txt"}
        migrations: {"globs": "**/migrations/*.py"}
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

- Added files: `tests/test.py`
- Changed files: `main.py` `helpers/utils.py` `requirements/api.txt`
- Deleted files: `utils.py` `requirements/aip.txt`

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
