import rewire from 'rewire'
import {getInputs} from '../src/utils/inputs'

const inputs = rewire('../lib/utils/inputs')

describe('test splitChangeMapString', () => {
  const splitChangeMapString = inputs.__get__('splitChangeMapString')

  test('returns correct label/config tuple', () => {
    const splitChangeMapLine = splitChangeMapString(
      'python_files: {"glob": "*.py", "separateDeleted": true}',
      ':'
    )

    expect(splitChangeMapLine).toEqual([
      'python_files',
      '{"glob": "*.py", "separateDeleted": true}'
    ])
  })
})

describe('test parseChangeMapInput', () => {
  const parseChangeMapInput = inputs.__get__('parseChangeMapInput')

  test('returns correct value', async () => {
    const changeMap = await parseChangeMapInput(`
      python_files: {"glob": "*.py", "separateDeleted": true}
      requirements: {"glob": "requirements/*.txt"}
    `)

    expect(changeMap).toEqual([
      {label: 'python_files', config: {glob: '*.py', separateDeleted: true}},
      {
        label: 'requirements',
        config: {glob: 'requirements/*.txt', separateDeleted: false}
      }
    ])
  })
})

describe('test parseFilterPatterns', () => {
  const parseFilterPatterns = inputs.__get__('parseFilterPatterns')

  test('returns correct value', async () => {
    const filterPatterns = await parseFilterPatterns(
      '{"ADDED":"A\\t", "CHANGED":"M\\t", "DELETED":"D\\t"}'
    )

    expect(filterPatterns).toEqual({
      ADDED: 'A\t',
      CHANGED: 'M\t',
      DELETED: 'D\t'
    })
  })

  test('throws error if parsed filter patterns are not an object', async () => {
    expect(parseFilterPatterns('true')).rejects.toEqual(
      new Error('filter-patterns must be a valid JSON object')
    )
  })
})

describe('test getInputs', () => {
  let revertProcessSet: () => void

  beforeAll(async () => {
    process.env['INPUT_BASE-BRANCH'] = 'base_branch'
    process.env['INPUT_FILTER-PATTERNS'] =
      '{"ADDED":"A\\t","CHANGED":"M\\t","DELETED":"D\\t"}'
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
        config: {glob: 'requirements/*.txt', separateDeleted: false}
      }
    ])

    expect(filterPatterns).toEqual({
      ADDED: 'A\t',
      CHANGED: 'M\t',
      DELETED: 'D\t'
    })
  })
})
