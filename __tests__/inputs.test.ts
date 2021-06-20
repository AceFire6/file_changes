import rewire from 'rewire'
import {getInputs} from '../src/utils/inputs'

const inputs = rewire('../lib/utils/inputs')

describe('test splitLabelMapString', () => {
  const splitLabelMapString = inputs.__get__('splitLabelMapString')

  test('returns correct label/config tuple', () => {
    const splitChangeMapLine = splitLabelMapString(
      'python_files: {"glob": "*.py", "separateDeleted": true}',
      ':',
    )

    expect(splitChangeMapLine).toEqual([
      'python_files',
      '{"glob": "*.py", "separateDeleted": true}',
    ])
  })
})

describe('test parseChangeMapInput', () => {
  const parseChangeMapInput = inputs.__get__('parseChangeMapInput')

  test('returns correct value', async () => {
    const changeMap = await parseChangeMapInput([
      'python_files: {"glob": "*.py", "separateDeleted": true}',
      'requirements: {"glob": "requirements/*.txt"}',
    ])

    expect(changeMap).toEqual([
      {label: 'python_files', config: {glob: '*.py', separateDeleted: true}},
      {
        label: 'requirements',
        config: {glob: 'requirements/*.txt', separateDeleted: false},
      },
    ])
  })
})

describe('test parseFilterPatterns', () => {
  const parseFilterPatterns = inputs.__get__('parseFilterPatterns')

  test('returns correct value', async () => {
    const filterPatterns = await parseFilterPatterns([
      'ADDED: {"pattern": "A\\t"}',
      'CHANGED: {"pattern": "M\\t"}',
      'DELETED: {"pattern": "D\\t"}',
    ])

    expect(filterPatterns).toEqual({
      ADDED: 'A\t',
      CHANGED: 'M\t',
      DELETED: 'D\t',
    })
  })
})

describe('test getInputs', () => {
  let revertProcessSet: () => void

  beforeAll(async () => {
    process.env['INPUT_BASE-BRANCH'] = 'base_branch'
    process.env['INPUT_FILTER-PATTERNS'] = `
      ADDED: {"pattern": "A\\t"}
      CHANGED: {"pattern": "M\\t"}
      DELETED: {"pattern": "D\\t"}
    `
    process.env['INPUT_COMMAND'] = "cat {branchName} | grep '{glob}'"
    process.env['INPUT_CHANGE-MAP'] = `
      python_files: {"glob": "*.py", "separateDeleted": true}
      requirements: {"glob": "requirements/*.txt"}
    `
    revertProcessSet = inputs.__set__('process.env', process.env)
  })

  afterAll(async () => {
    delete process.env['INPUT_CHANGE-MAP']
    revertProcessSet()
  })

  test('returns correct values', async () => {
    const {fileChangeFindCommand, changeMap, filterPatterns} = await getInputs()

    expect(fileChangeFindCommand).toEqual("cat base_branch | grep '{glob}'")

    expect(changeMap).toEqual([
      {label: 'python_files', config: {glob: '*.py', separateDeleted: true}},
      {
        label: 'requirements',
        config: {glob: 'requirements/*.txt', separateDeleted: false},
      },
    ])

    expect(filterPatterns).toEqual({
      ADDED: 'A\t',
      CHANGED: 'M\t',
      DELETED: 'D\t',
    })
  })
})
