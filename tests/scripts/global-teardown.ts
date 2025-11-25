import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default async function globalTeardown() {
  const scriptPath = path.join(__dirname, 'restore-db.sh')
  console.log('\n🔄 Restoring database after tests...')
  execSync(`bash "${scriptPath}"`, { stdio: 'inherit' })
}
