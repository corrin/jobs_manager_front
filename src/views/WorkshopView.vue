<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { schemas } from '@/api/generated/api'
import { api } from '@/api/client'
import { z } from 'zod'
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card'
import AppLayout from '@/components/AppLayout.vue'
import router from '@/router'
import { Contact, NotebookText, Briefcase } from 'lucide-vue-next'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAppLayout } from '@/composables/useAppLayout'

type Job = z.infer<typeof schemas.WorkshopJob>
const jobs = ref<Job[]>([])

const goToJob = (jobId: string) => {
  router.push(`/jobs/${jobId}`)
}

const getJobDescription = (job: Job) => {
  const description = (job.description || '').trim()

  if (description.length === 0) {
    return job.name
  }
  return description.length > 25 ? description.slice(0, 25) + '...' : description
}

// The API should always send first name (or preferred name) and last name
const getInitials = (name: string) => {
  name = name.trim()

  if (!(name.length > 0)) return

  const names = name.split(" ")

  return names[0][0] + names[1][0]
}

const { userInfo } = useAppLayout()

onMounted(async () => {
  jobs.value = await api.job_api_jobs_workshop_list()
})
</script>

<template>
  <AppLayout>
    <div class="h-full w-full min-h-screen flex flex-col justify-start items-center gap-2 py-10">
      <div class="text-2xl font-bold mb-10">
        Welcome, {{ userInfo.displayName }}!
      </div>
      <div class="overflow-y-auto bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col items-center">
        <div class="text-xl font-semibold pt-4">
          Next jobs
        </div>
        <div class="flex flex-col gap-4 p-4 items-center w-full max-h-[720px]">
          <Card v-for="job in jobs" :key="job.id" class="w-md hover:ring-2 hover:ring-blue-500" @click="goToJob(job.id)">
            <CardHeader>
              <CardTitle class="p-2 rounded-md text-white bg-blue-600 text-lg font-semibold mr-auto">
                Job #{{ job.job_number }}
              </CardTitle>
              <CardAction class="flex">
                <Avatar v-for="staff in job.people" :key="staff.id">
                  <AvatarImage :src="staff.icon_url || ''"/>
                  <AvatarFallback>{{ getInitials(staff.display_name) }}</AvatarFallback>
                </Avatar>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div class="text-xl text-black font-semibold">
                <Briefcase class="inline-block" />
                Customer: <span class="text-gray font-medium text-lg">{{ job.client_name }}</span>
              </div>
              <div class="text-xl text-black font-semibold">
                <NotebookText class="inline-block" />
                Description: <span class="text-gray font-medium text-lg">{{ getJobDescription(job) }}</span>
              </div>
              <div class="text-xl text-black font-semibold" v-if="job.contact_person">
                <Contact class="inline-block" />
                Contact: <span class="text-gray font-medium text-lg">{{ job.contact_person }}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
