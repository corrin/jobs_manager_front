import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { ensureXeroConnected } from './xero-login'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default async function globalSetup() {
  // Step 1: Backup database
  const scriptPath = path.join(__dirname, 'backup-db.sh')
  console.log('Backing up database before tests...')
  try {
    execSync(`bash "${scriptPath}"`, { stdio: 'inherit' })
  } catch (error) {
    console.error('Database backup failed. Aborting tests.')
    throw error
  }

  // Step 2: Ensure Xero is connected
  console.log('Ensuring Xero connection...')
  await ensureXeroConnected()
}
