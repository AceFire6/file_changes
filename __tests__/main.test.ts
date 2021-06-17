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

  console.log(`Running ${np} - ${ip} - ${Object.entries(options)}`)
  console.log(cp.execFileSync(np, [ip], options).toString())
})
