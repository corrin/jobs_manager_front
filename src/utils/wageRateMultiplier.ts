export const WAGE_RATE_MULTIPLIER_META_KEY = 'wage_rate_multiplier'

export type RateMultiplierMetaRecord = Record<string, unknown> & {
  wage_rate_multiplier?: number
}

export function getRateMultiplierFromMeta(meta?: RateMultiplierMetaRecord, fallback = 1): number {
  const value = meta?.[WAGE_RATE_MULTIPLIER_META_KEY]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function setRateMultiplierOnMeta<T extends RateMultiplierMetaRecord | undefined>(
  meta: T,
  multiplier: number | null | undefined,
): RateMultiplierMetaRecord {
  const nextMeta: RateMultiplierMetaRecord = { ...(meta || {}) }

  if (typeof multiplier === 'number' && Number.isFinite(multiplier)) {
    nextMeta[WAGE_RATE_MULTIPLIER_META_KEY] = multiplier
  } else {
    delete nextMeta[WAGE_RATE_MULTIPLIER_META_KEY]
  }

  if ('rate_multiplier' in nextMeta) {
    delete (nextMeta as Record<string, unknown>).rate_multiplier
  }

  return nextMeta
}
