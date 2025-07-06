import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'

export interface Job {
  id: string
  name: string
}

export const useJobStore = defineStore('jobs', () => {
  const jobs = ref<Job[]>([])
  const loading = ref(false)

  async function fetchJobs() {
    loading.value = true
    try {
      const res = await api.get('/job/rest/')
      jobs.value = res.data
    } finally {
      loading.value = false
    }
  }

  return { jobs, loading, fetchJobs }
})
