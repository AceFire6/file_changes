import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'


// shows how the runner will run a javascript action with env / stdout protocol
test('test runs does not error', () => {
  process.env['INPUT_BASE-BRANCH'] = 'test_changes'
  process.env['INPUT_FILTER-PATTERNS'] = '{"ADDED":"A\\t","CHANGED":"M\\t","DELETED":"D\\t"}'
  process.env['INPUT_COMMAND'] = 'cat ./__tests__/{branchName}.txt | grep \'{glob}\''
  process.env['INPUT_CHANGE-MAP'] = `
  png: {"glob": ".png"}
  txt: {"glob": ".txt", "separateDeleted": true}
  `

  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env,
  }

  const result = cp.execFileSync(np, [ip], options).toString()

  const expectedPngOutput = [
    '::set-output name=png::added_img.png changed_img.png',
    '::set-output name=any-png::true'
  ].join('\n')

  const expectedTxtOutput = [
    '::set-output name=deleted-txt::deleted_text.txt',
    '::set-output name=txt::added_text.txt changed_text.txt',
    '::set-output name=any-txt::true',
    '::set-output name=any-matches::true',
  ].join('\n')

  expect(result).toContain(expectedPngOutput)
  expect(result).toContain(expectedTxtOutput)
})
