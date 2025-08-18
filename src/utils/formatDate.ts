export function formatInNZT(
  dateLike: string | number | Date,
  opts: Intl.DateTimeFormatOptions = {},
) {
  try {
    const d = new Date(dateLike)
    return new Intl.DateTimeFormat('en-NZ', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...opts,
    }).format(d)
  } catch {
    // Fallback to raw ISO if parsing fails
    return String(dateLike)
  }
}
