import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Padrões para identificar estados de carregamento que precisam ser melhorados
const patterns = [
  // Textos que indicam "sem dados" mas que deveriam mostrar "carregando"
  /No\s+\w+\s+(found|available|in|here)/gi,
  /Drag\s+\w+\s+here/gi,
  /Empty\s+\w+/gi,

  // Componentes Vue que podem ter loading states
  /v-if.*loading/gi,
  /v-show.*loading/gi,
  /:loading=/gi,

  // Estados de loading em composables/stores
  /isLoading/gi,
  /loading\.value/gi,
  /\.loading/gi,

  // Skeleton loaders ou placeholders
  /skeleton/gi,
  /placeholder/gi,

  // Async operations que podem precisar de loading states
  /await\s+\w+Service/gi,
  /async\s+\w+\(/gi,

  // Conditional rendering que pode esconder loading states
  /v-if.*length/gi,
  /v-if.*\[\]/gi,
]

const fileExtensions = ['.vue', '.ts', '.js']
const excludeDirs = ['node_modules', '.git', 'dist', 'build']

function searchInFile(filePath, content) {
  const results = []
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    patterns.forEach((pattern) => {
      if (pattern.test(line)) {
        results.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          pattern: pattern.toString(),
        })
      }
    })
  })

  return results
}

function searchDirectory(dir, results = []) {
  const items = fs.readdirSync(dir)

  items.forEach((item) => {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory() && !excludeDirs.includes(item)) {
      searchDirectory(fullPath, results)
    } else if (stat.isFile() && fileExtensions.some((ext) => item.endsWith(ext))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8')
        const matches = searchInFile(fullPath, content)
        results.push(...matches)
      } catch (error) {
        console.error(`Erro ao ler arquivo ${fullPath}:`, error.message)
      }
    }
  })

  return results
}

function generateReport(results) {
  const groupedByFile = results.reduce((acc, result) => {
    if (!acc[result.file]) {
      acc[result.file] = []
    }
    acc[result.file].push(result)
    return acc
  }, {})

  let report = '# Loading States Mapping Report\n\n'
  report += `Total files with potential loading state issues: ${Object.keys(groupedByFile).length}\n`
  report += `Total matches found: ${results.length}\n\n`

  // Agrupar por categorias
  const categories = {
    'Vue Components': [],
    Services: [],
    'Composables/Stores': [],
    Templates: [],
  }

  Object.entries(groupedByFile).forEach(([file, matches]) => {
    if (file.includes('.vue')) {
      categories['Vue Components'].push({ file, matches })
    } else if (file.includes('service')) {
      categories['Services'].push({ file, matches })
    } else if (file.includes('composable') || file.includes('store')) {
      categories['Composables/Stores'].push({ file, matches })
    } else {
      categories['Templates'].push({ file, matches })
    }
  })

  Object.entries(categories).forEach(([category, files]) => {
    if (files.length > 0) {
      report += `## ${category}\n\n`
      files.forEach(({ file, matches }) => {
        const relativePath = path.relative(process.cwd(), file)
        report += `### ${relativePath}\n\n`
        matches.forEach((match) => {
          report += `- **Linha ${match.line}**: \`${match.content}\`\n`
        })
        report += '\n'
      })
    }
  })

  return report
}

// Execute the mapping
const frontendDir = path.join(__dirname, '../src')
console.log('Mapping loading states in:', frontendDir)

const results = searchDirectory(frontendDir)
const report = generateReport(results)

// Save the report
const reportPath = path.join(__dirname, 'loading-states-report.md')
fs.writeFileSync(reportPath, report)

console.log(`Report saved to: ${reportPath}`)
console.log(`Total files analyzed: ${results.length}`)
