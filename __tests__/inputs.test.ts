import rewire from 'rewire'

const inputs = rewire('../lib/utils/inputs')

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
