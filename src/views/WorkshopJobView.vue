<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { jobService } from '@/services/job.service'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  Gauge,
  Hash,
  NotebookText,
  Timer,
  UserRound,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { schemas } from '@/api/generated/api'
import { z } from 'zod'
import DOMPurify from 'dompurify'
import WorkshopMaterialsUsedTable from '@/components/workshop/WorkshopMaterialsUsedTable.vue'

type Job = z.infer<typeof schemas.Job>

const route = useRoute()
const router = useRouter()

const jobId = computed(() => route.params.id as string)
const job = ref<Job | null>(null)
const loading = ref(false)

const notesHtml = computed(() => {
  const html = (job.value?.notes ?? '').trim()
  if (!html) return ''

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'style', 'class'],
  })
})

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '—'
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
}

const speedQuality = computed(() => {
  const v = job.value?.speed_quality_tradeoff
  if (!v) return null
  const label = v === 'fast' ? 'Fast' : v === 'quality' ? 'Quality' : 'Balanced'
  const variant: 'default' | 'secondary' | 'destructive' =
    v === 'fast' ? 'destructive' : v === 'quality' ? 'default' : 'secondary'
  return { key: v, label, variant }
})

const workshopTime = computed(() => {
  const actual = job.value?.latest_actual?.summary?.hours ?? 0
  const quote = job.value?.latest_quote?.summary?.hours ?? 0
  const estimate = job.value?.latest_estimate?.summary?.hours ?? 0

  if (actual > 0) return { hours: actual, source: 'Actual' as const }
  if (quote > 0) return { hours: quote, source: 'Quote' as const }
  if (estimate > 0) return { hours: estimate, source: 'Estimate' as const }
  return { hours: null, source: null }
})

const workshopTimeDisplay = computed(() => {
  const hours = workshopTime.value.hours
  if (hours === null) return '-'
  const rounded = Math.round(hours * 10) / 10
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} h`
})

async function loadJob() {
  if (!jobId.value) return
  loading.value = true
  try {
    const response = await jobService.getJob(jobId.value)
    job.value = response.data.job
  } catch (error) {
    console.error('Failed to load workshop job:', error)
    job.value = null
    toast.error('Failed to load job', {
      description: 'Please refresh and try again.',
    })
  } finally {
    loading.value = false
  }
}

function navigateBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push({ name: 'workshop-kanban' })
}

onMounted(loadJob)
watch(jobId, () => void loadJob())
</script>

<template>
  <AppLayout>
    <div class="flex flex-col h-full min-h-0 bg-muted/10">
      <header class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div class="px-4 py-4 sm:px-6">
          <div class="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              class="mt-0.5 h-10 w-10"
              @click="navigateBack"
              aria-label="Back"
            >
              <ArrowLeft class="h-5 w-5" />
            </Button>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <Badge class="text-sm sm:text-base px-3 py-1" v-if="job"
                  >Job #{{ job.job_number }}</Badge
                >
                <Badge v-else variant="secondary" class="text-sm sm:text-base px-3 py-1">
                  <Skeleton class="h-4 w-20" />
                </Badge>

                <Badge
                  v-if="speedQuality"
                  :variant="speedQuality.variant"
                  class="text-xs sm:text-sm"
                >
                  <Gauge class="h-3.5 w-3.5 mr-1" />
                  {{ speedQuality.label }}
                </Badge>

                <Badge v-if="job?.order_number" variant="secondary" class="text-xs sm:text-sm">
                  <Hash class="h-3.5 w-3.5 mr-1" />
                  Order {{ job.order_number }}
                </Badge>
              </div>

              <div class="mt-2">
                <h1
                  v-if="job"
                  class="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground break-words"
                >
                  {{ job.name }}
                </h1>
                <div v-else class="space-y-2">
                  <Skeleton class="h-8 w-3/4 max-w-lg" />
                  <Skeleton class="h-4 w-2/3 max-w-[24rem]" />
                </div>

                <div
                  v-if="job"
                  class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"
                >
                  <span class="inline-flex items-center gap-1">
                    <Building2 class="h-4 w-4" />
                    <span class="font-medium text-foreground">Client:</span>
                    {{ job.client_name || '-' }}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <UserRound class="h-4 w-4" />
                    <span class="font-medium text-foreground">Contact:</span>
                    {{ job.contact_name || '-' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
        <div v-if="loading" class="grid gap-4 lg:gap-6 lg:grid-cols-12">
          <Card class="lg:col-span-5">
            <CardHeader>
              <CardTitle><Skeleton class="h-5 w-28" /></CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-5/6" />
              <Skeleton class="h-4 w-4/6" />
              <Skeleton class="h-4 w-3/6" />
            </CardContent>
          </Card>

          <Card class="lg:col-span-7">
            <CardHeader>
              <CardTitle><Skeleton class="h-5 w-24" /></CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Skeleton class="h-20 w-full" />
              <Skeleton class="h-20 w-full" />
              <Skeleton class="h-20 w-full" />
            </CardContent>
          </Card>

          <Card class="lg:col-span-12">
            <CardHeader>
              <CardTitle><Skeleton class="h-5 w-24" /></CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-11/12" />
              <Skeleton class="h-4 w-10/12" />
            </CardContent>
          </Card>
        </div>

        <div v-else-if="!job" class="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Job not found</CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground">
              This job could not be loaded. Go back and try again.
            </CardContent>
          </Card>
        </div>

        <div v-else class="grid gap-4 lg:gap-6 lg:grid-cols-12">
          <Card class="lg:col-span-5">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <ClipboardList class="h-5 w-5" />
                Key info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt class="text-xs uppercase tracking-wide text-muted-foreground">Job number</dt>
                  <dd class="mt-1 text-base font-medium text-foreground">
                    {{ job.job_number }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-muted-foreground">
                    Order number
                  </dt>
                  <dd class="mt-1 text-base font-medium text-foreground">
                    {{ job.order_number || '-' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-muted-foreground">Entry date</dt>
                  <dd
                    class="mt-1 text-base font-medium text-foreground inline-flex items-center gap-2"
                  >
                    <CalendarClock class="h-4 w-4 text-muted-foreground" />
                    {{ formatDate(job.created_at) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-muted-foreground">Due date</dt>
                  <dd
                    class="mt-1 text-base font-medium text-foreground inline-flex items-center gap-2"
                  >
                    <CalendarClock class="h-4 w-4 text-muted-foreground" />
                    {{ formatDate(job.delivery_date) }}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card class="lg:col-span-7">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Timer class="h-5 w-5" />
                Workshop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div class="rounded-lg border bg-card px-3 py-3">
                  <div class="text-xs uppercase tracking-wide text-muted-foreground">
                    Workshop time
                  </div>
                  <div class="mt-1 text-2xl font-semibold tracking-tight">
                    {{ workshopTimeDisplay }}
                  </div>
                  <div v-if="workshopTime.source" class="mt-1 text-xs text-muted-foreground">
                    From {{ workshopTime.source.toLowerCase() }}
                  </div>
                </div>
                <div class="rounded-lg border bg-card px-3 py-3">
                  <div class="text-xs uppercase tracking-wide text-muted-foreground">
                    Speed / quality
                  </div>
                  <div class="mt-1 text-2xl font-semibold tracking-tight">
                    {{ speedQuality?.label ?? '-' }}
                  </div>
                </div>
                <div class="rounded-lg border bg-card px-3 py-3">
                  <div class="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                  <div class="mt-1 text-2xl font-semibold tracking-tight capitalize">
                    {{ job.job_status.split('_').join(' ') }}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="lg:col-span-12">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <FileText class="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                class="rounded-md border bg-background px-3 py-3 text-base leading-relaxed whitespace-pre-wrap"
              >
                {{ job.description?.trim() ? job.description : '-' }}
              </div>
            </CardContent>
          </Card>

          <Card class="lg:col-span-12">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <NotebookText class="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                class="rounded-md border bg-background px-3 py-3 text-base leading-relaxed workshop-richtext"
              >
                <div v-if="notesHtml" v-html="notesHtml" />
                <span v-else>—</span>
              </div>
            </CardContent>
          </Card>

          <div class="lg:col-span-12">
            <WorkshopMaterialsUsedTable :job-id="jobId" />
          </div>
        </div>
      </main>
    </div>
  </AppLayout>
</template>

<style scoped>
.workshop-richtext :deep(p) {
  margin: 0 0 0.75rem;
}
.workshop-richtext :deep(p:last-child) {
  margin-bottom: 0;
}
.workshop-richtext :deep(ul),
.workshop-richtext :deep(ol) {
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}
.workshop-richtext :deep(li) {
  margin: 0.25rem 0;
}
.workshop-richtext :deep(a) {
  text-decoration: underline;
}
</style>
