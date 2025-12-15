<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { schemas } from '@/api/generated/api'
import { api } from '@/api/client'
import { z } from 'zod'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

type Job = z.infer<typeof schemas.WorkshopJob>
const jobs = ref<Job[]>([])

onMounted(async () => {
  jobs.value = await api.job_api_jobs_workshop_list()
})
</script>

<template>
  <div class="h-full w-full min-h-screen flex">
    <div class="h-96 overflow-y-auto">
      <div class="grid grid-cols-3 gap-4 p-4">
        <Card v-for="job in jobs" :key="job.id" class="w-sm h-sm">
          <CardHeader>
            <CardTitle class="p-2 rounded-md text-white bg-blue-600">{{
              job.job_number
            }}</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 class="text-lg font-semibold mb-2">{{ job.client_name }}</h3>
            <p class="text-sm">{{ job.description }}</p>
          </CardContent>
          <CardFooter>
            <p class="text-xs text-black">Contact: {{ job.contact_person }}</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
