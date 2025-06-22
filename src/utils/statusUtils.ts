/**
 * Status utilities following SRP principle
 * Centralized status-related functions with guard clauses
 */

/**
 * Get status variant with guard clause for undefined values
 */
export function getStatusVariant(status: string | undefined): string {
  // Guard clause - early return for undefined/null
  if (!status) {
    return 'secondary'
  }

  // Switch-case for discrete status values
  switch (status.toLowerCase()) {
    case 'quoting':
      return 'secondary'
    case 'accepted_quote':
      return 'default'
    case 'in_progress':
      return 'default'
    case 'completed':
      return 'outline'
    case 'on_hold':
      return 'destructive'
    case 'archived':
      return 'outline'
    default:
      return 'secondary'
  }
}

/**
 * Get job color with guard clause for undefined jobId
 */
export function getJobColor(jobId: string | undefined): string {
  // Guard clause - early return for undefined
  if (!jobId) {
    return 'bg-gray-100'
  }

  // Generate consistent color based on jobId hash
  const hash = jobId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  const colors = [
    'bg-blue-100',
    'bg-green-100',
    'bg-yellow-100',
    'bg-purple-100',
    'bg-pink-100',
    'bg-indigo-100',
  ]

  return colors[Math.abs(hash) % colors.length]
}
