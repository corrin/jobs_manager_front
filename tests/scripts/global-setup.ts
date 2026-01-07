import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import { ensureXeroConnected } from './xero-login'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCK_FILE = '/tmp/playwright-e2e.lock'

export default async function globalSetup() {
  // Step 0: Check for existing test run
  if (fs.existsSync(LOCK_FILE)) {
    const pid = fs.readFileSync(LOCK_FILE, 'utf8').trim()
    throw new Error(`E2E tests already running (PID: ${pid}). Kill it or delete ${LOCK_FILE}`)
  }
  fs.writeFileSync(LOCK_FILE, process.pid.toString())

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
