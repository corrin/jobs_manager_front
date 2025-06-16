import { ref, computed } from 'vue'
import type { JobData } from '@/services/job-rest.service'

interface CacheEntry {
  data: JobData
  timestamp: Date
  version: number
}

/**
 * Composable para cache inteligente de jobs
 * Evita carregamentos desnecessários e melhora a performance
 */
export function useJobCache() {
  const cache = ref<Map<string, CacheEntry>>(new Map())
  const currentVersion = ref(1)

  // TTL padrão de 5 minutos
  const DEFAULT_TTL = 5 * 60 * 1000

  /**
   * Verifica se uma entrada do cache ainda é válida
   */
  const isCacheValid = (entry: CacheEntry, ttl: number = DEFAULT_TTL): boolean => {
    const now = new Date().getTime()
    const entryTime = entry.timestamp.getTime()
    const isWithinTTL = (now - entryTime) < ttl
    const isCurrentVersion = entry.version === currentVersion.value

    return isWithinTTL && isCurrentVersion
  }

  /**
   * Obtém dados do cache se válidos
   */
  const getCachedJob = (jobId: string, ttl?: number): JobData | null => {
    const entry = cache.value.get(jobId)

    if (!entry) {
      console.log(`📦 Cache miss for job ${jobId}`)
      return null
    }

    if (!isCacheValid(entry, ttl)) {
      console.log(`📦 Cache expired for job ${jobId}`)
      cache.value.delete(jobId)
      return null
    }

    console.log(`📦 Cache hit for job ${jobId}`)
    return entry.data
  }

  /**
   * Armazena dados no cache
   */
  const setCachedJob = (jobId: string, jobData: JobData): void => {
    const entry: CacheEntry = {
      data: { ...jobData }, // Deep copy
      timestamp: new Date(),
      version: currentVersion.value
    }

    cache.value.set(jobId, entry)
    console.log(`📦 Job ${jobId} cached`)
  }

  /**
   * Remove um job específico do cache
   */
  const removeCachedJob = (jobId: string): void => {
    if (cache.value.delete(jobId)) {
      console.log(`📦 Job ${jobId} removed from cache`)
    }
  }

  /**
   * Invalida todo o cache (incrementa versão)
   */
  const invalidateAll = (): void => {
    currentVersion.value++
    console.log(`📦 Cache invalidated - new version: ${currentVersion.value}`)
  }

  /**
   * Limpa fisicamente o cache
   */
  const clearCache = (): void => {
    cache.value.clear()
    console.log('📦 Cache cleared')
  }

  /**
   * Atualiza dados no cache se existir
   */
  const updateCachedJob = (jobId: string, updates: Partial<JobData>): void => {
    const entry = cache.value.get(jobId)

    if (entry && isCacheValid(entry)) {
      const updatedData = { ...entry.data, ...updates }
      setCachedJob(jobId, updatedData)
      console.log(`📦 Job ${jobId} updated in cache`)
    }
  }

  /**
   * Verifica se um job está em cache e válido
   */
  const isCached = (jobId: string, ttl?: number): boolean => {
    const entry = cache.value.get(jobId)
    return entry ? isCacheValid(entry, ttl) : false
  }

  // Computed properties para estatísticas do cache
  const cacheSize = computed(() => cache.value.size)

  const cacheStats = computed(() => {
    let validEntries = 0
    let expiredEntries = 0

    cache.value.forEach(entry => {
      if (isCacheValid(entry)) {
        validEntries++
      } else {
        expiredEntries++
      }
    })

    return {
      total: cache.value.size,
      valid: validEntries,
      expired: expiredEntries
    }
  })

  /**
   * Função helper para usar com APIs
   * Retorna dados do cache se válidos, senão executa a função de carregamento
   */
  const withCache = async <T extends JobData>(
    jobId: string,
    loadFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    // Tentar obter do cache primeiro
    const cached = getCachedJob(jobId, ttl)
    if (cached) {
      return cached as T
    }

    // Se não estiver em cache ou expirado, carregar dos dados
    console.log(`📦 Loading job ${jobId} from API...`)
    const freshData = await loadFunction()

    // Armazenar no cache
    setCachedJob(jobId, freshData)

    return freshData
  }

  return {
    // Methods
    getCachedJob,
    setCachedJob,
    removeCachedJob,
    updateCachedJob,
    isCached,
    invalidateAll,
    clearCache,
    withCache,

    // Computed properties
    cacheSize,
    cacheStats,
    currentVersion: computed(() => currentVersion.value)
  }
}
