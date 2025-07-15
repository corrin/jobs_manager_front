import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import { debugLog } from '@/utils/debug'
import type { XeroItemUI } from '@/api/local/schemas'

export const useXeroItemStore = defineStore('xeroItems', () => {
  const items = ref<XeroItemUI[]>([])
  const loading = ref(false)

  async function fetchItems() {
    loading.value = true
    try {
      const res = await api.get('/purchasing/rest/xero-items/')
      items.value = Array.isArray(res.data) ? res.data : []
      debugLog('Xero items fetched:', items.value)
    } finally {
      loading.value = false
    }
  }

  return { items, loading, fetchItems }
})
