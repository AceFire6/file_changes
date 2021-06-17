import rewire from 'rewire'

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
