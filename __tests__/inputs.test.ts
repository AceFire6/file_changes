import rewire from 'rewire'

const inputs = rewire('../lib/utils/inputs')

describe('test getChangeMapInput', () => {
  const getChangeMapInput = inputs.__get__('getChangeMapInput')
  let revertProcessSet: () => void

  beforeAll(async () => {
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

  test('returns correct value', async () => {
    const changeMap = await getChangeMapInput()

    expect(changeMap).toEqual([
      {label: 'python_files', config: {glob: '*.py', separateDeleted: true}},
      {
        label: 'requirements',
        config: {glob: 'requirements/*.txt', separateDeleted: false}
      }
    ])
  })
})
