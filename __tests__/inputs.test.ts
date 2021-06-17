import rewire from 'rewire'

const inputs = rewire('../lib/utils/inputs')

describe('test splitChangeMapString', () => {
  const splitChangeMapString = inputs.__get__('splitChangeMapString')

  test('returns correct label/config tuple', () => {
    const result = splitChangeMapString(
      'python_files: {"glob": "*.py", "separateDeleted": true}',
      ':'
    )

    expect(result).toEqual([
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
    const changeMap = await parseFilterPatterns(
      '{"ADDED":"A\\t", "CHANGED":"M\\t", "DELETED":"D\\t"}'
    )

    expect(changeMap).toEqual({ADDED: 'A\t', CHANGED: 'M\t', DELETED: 'D\t'})
  })
})
