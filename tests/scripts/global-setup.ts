import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default async function globalSetup() {
  const scriptPath = path.join(__dirname, 'backup-db.sh')
  console.log('\n🔄 Backing up database before tests...')
  execSync(`bash "${scriptPath}"`, { stdio: 'inherit' })
}
