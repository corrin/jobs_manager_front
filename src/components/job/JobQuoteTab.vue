<template>
  <div class="job-quote-tab h-full flex flex-col">
    <div class="flex-shrink-0 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            Quote Management{{
              currentQuote?.has_quote ? ` - Revision ${currentQuote.quote?.rev}` : ''
            }}
          </h2>
        </div>
      </div>
    </div>

    <!-- CONTENT: STICKY GRID ASIDE + MAIN -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 min-h-0">
      <!-- MAIN -->
      <main class="bg-white rounded-xl border border-slate-200 flex flex-col min-h-0">
        <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Quote Details</h3>
          <button
            class="inline-flex items-center justify-center h-9 px-3 rounded-md bg-blue-600 text-white border border-blue-700 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style="min-width: 0"
            @click="onCopyFromEstimate"
            :disabled="
              isLoading || !props.jobData?.latest_estimate?.cost_lines?.length || !hasEstimateData
            "
            :title="'Copy from Estimate'"
          >
            <Copy class="w-4 h-4 mr-1" /> Copy from Estimate
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-auto">
          <div v-if="isLoading" class="h-full flex items-center justify-center text-gray-500 gap-2">
            <!-- spinner -->
          </div>
          <template v-else>
            <SmartCostLinesTable
              v-if="hasCostSetQuote"
              :lines="costLines"
              tabKind="quote"
              :readOnly="isLoading || areEditsBlocked"
              :showItemColumn="true"
              :showSourceColumn="false"
              @delete-line="handleSmartDelete"
              @add-line="handleAddEmptyLine"
              @duplicate-line="(line) => handleAddMaterial(line)"
              @create-line="handleCreateFromEmpty"
            />
            <div v-else class="text-center py-8 text-gray-500">No quote data available</div>
          </template>
        </div>
      </main>

      <!-- ASIDE -->
      <aside class="space-y-4 lg:sticky lg:top-16 self-start">
        <!-- Summary -->
        <div class="bg-white rounded-xl border border-slate-200">
          <div class="p-3 w-full">
            <CompactSummaryCard
              :key="`quote-summary-compact-${quoteKey}`"
              title="Quote Summary"
              class="w-full"
              :summary="currentQuote.quote?.summary"
              :costLines="quoteCostLines"
              :isLoading="isLoading"
              :revision="currentQuote.quote?.rev"
              @expand="showDetailedSummary = true"
            />
          </div>
        </div>

        <!-- Quote Management -->
        <div class="bg-white rounded-xl border border-slate-200">
          <Card class="border-0 shadow-none">
            <CardHeader class="pb-2 flex flex-col items-center">
              <CardTitle>Quote Management</CardTitle>
              <CardDescription>Manage quotes for this job.</CardDescription>
            </CardHeader>

            <CardContent>
              <template v-if="hasXeroQuote">
                <div class="space-y-2">
                  <div class="flex items-center gap-3">
                    <span class="h-8 w-1 rounded bg-blue-500/80"></span>
                    <div>
                      <div class="text-sm uppercase tracking-wide text-slate-500">Quote total</div>
                      <div class="text-1xl font-semibold tabular-nums text-slate-900">
                        {{ formatCurrency(localQuote?.total_excl_tax || 0) }}
                      </div>
                      <div v-if="isQuoteAccepted" class="text-xs text-emerald-700 font-medium">
                        Accepted · {{ formatDate(props.jobData!.quote_acceptance_date!) }}
                      </div>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <div class="flex items-center gap-3">
                      <span class="text-[11px] uppercase tracking-wide text-slate-500">Xero</span>
                      <div class="h-px bg-slate-200 flex-1"></div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <Button
                        class="mr-10"
                        variant="outline"
                        size="sm"
                        @click="goToQuoteOnXero"
                        :disabled="!localQuote?.online_url"
                      >
                        <ExternalLink class="h-4 w-4 mr-1" /> Open in Xero
                      </Button>

                      <Button
                        v-if="!isQuoteAccepted"
                        size="sm"
                        class="bg-emerald-600 hover:bg-emerald-700 text-white"
                        :disabled="isAcceptingQuote"
                        @click="acceptQuote"
                      >
                        <svg
                          v-if="isAcceptingQuote"
                          class="animate-spin h-4 w-4 mr-1"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                          />
                        </svg>
                        {{ isAcceptingQuote ? 'Accepting…' : 'Accept Quote' }}
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        :disabled="isDeletingQuote"
                        @click="deleteQuoteOnXero"
                      >
                        <svg
                          v-if="isDeletingQuote"
                          class="animate-spin h-4 w-4 mr-1"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                          />
                        </svg>
                        {{ isDeletingQuote ? 'Deleting…' : 'Delete' }}
                      </Button>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <div class="flex items-center gap-3">
                      <span class="text-[11px] uppercase tracking-wide text-slate-500">Local</span>
                      <div class="h-px bg-slate-200 flex-1"></div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <Button
                        class="mr-50"
                        variant="outline"
                        size="sm"
                        @click="onShowQuoteRevisions"
                      >
                        <BookOpen class="h-4 w-4 mr-1" /> Revisions
                      </Button>
                      <Button variant="outline" size="sm" @click="printJob">
                        <Printer class="h-4 w-4 mr-1" /> Print
                      </Button>
                      <Button variant="outline" size="sm" @click="downloadJobSheet">
                        <Download class="h-4 w-4 mr-1" /> Download Sheet
                      </Button>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="flex flex-col items-center text-center py-8">
                  <div class="text-gray-500 mb-4">No quotes for this project</div>
                  <button
                    @click="createQuote"
                    :disabled="isCreatingQuote"
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg
                      v-if="isCreatingQuote"
                      class="animate-spin -ml-1 mr-1 h-4 w-4"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                    </svg>
                    {{ isCreatingQuote ? 'Creating...' : 'Create Quote' }}
                  </button>
                  <div class="space-y-2">
                    <div class="flex items-center gap-3">
                      <span class="text-[11px] uppercase tracking-wide text-slate-500">Local</span>
                      <div class="h-px bg-slate-200 flex-1"></div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <Button
                        class="mr-50"
                        variant="outline"
                        size="sm"
                        @click="onShowQuoteRevisions"
                      >
                        <BookOpen class="h-4 w-4 mr-1" /> Revisions
                      </Button>
                      <Button variant="outline" size="sm" @click="printJob">
                        <Printer class="h-4 w-4 mr-1" /> Print
                      </Button>
                      <Button variant="outline" size="sm" @click="downloadJobSheet">
                        <Download class="h-4 w-4 mr-1" /> Download Sheet
                      </Button>
                    </div>
                  </div>
                </div>
              </template>
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>

    <Dialog :open="showPreviewModal" @update:open="showPreviewModal = $event">
      <DialogContent class="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Quote Refresh Preview</DialogTitle>
          <DialogDescription>
            Review the changes that will be applied to your quote
          </DialogDescription>
        </DialogHeader>
        <div v-if="previewData" class="space-y-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="font-medium text-blue-900 mb-3">Summary of Changes</h4>
            <div
              v-if="
                previewData.changes &&
                (previewData.changes.additions?.length ||
                  previewData.changes.updates?.length ||
                  previewData.changes.deletions?.length)
              "
              class="grid grid-cols-3 gap-4 text-sm"
            >
              <div class="text-center">
                <div class="text-lg font-bold text-green-600">
                  {{ previewData.changes.additions?.length || 0 }}
                </div>
                <div class="text-gray-600">Additions</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-blue-600">
                  {{ previewData.changes.updates?.length || 0 }}
                </div>
                <div class="text-gray-600">Updates</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-red-600">
                  {{ previewData.changes.deletions?.length || 0 }}
                </div>
                <div class="text-gray-600">Deletions</div>
              </div>
            </div>
            <div v-else class="text-center">
              <div class="text-lg font-bold text-gray-600">0</div>
              <div class="text-gray-600">No changes detected</div>
              <div class="text-sm text-gray-500 mt-1">
                The spreadsheet is in sync with the system
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <button class="px-4 py-2 bg-gray-200 rounded-md mr-2" @click="showPreviewModal = false">
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md font-medium"
            :disabled="
              !previewData?.changes ||
              (!previewData.changes.additions?.length &&
                !previewData.changes.updates?.length &&
                !previewData.changes.deletions?.length) ||
              isRefreshing
            "
            @click="onApplySpreadsheetChanges"
          >
            {{
              !previewData?.changes ||
              (!previewData.changes.additions?.length &&
                !previewData.changes.updates?.length &&
                !previewData.changes.deletions?.length)
                ? 'No Changes to Apply'
                : `Apply ${
                    (previewData.changes.additions?.length || 0) +
                    (previewData.changes.updates?.length || 0) +
                    (previewData.changes.deletions?.length || 0)
                  } Changes`
            }}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Quote Revisions Modal -->
    <Dialog :open="showQuoteRevisionsModal" @update:open="showQuoteRevisionsModal = $event">
      <DialogContent class="sm:max-w-5xl max-h-[90vh] min-h-[70vh] flex flex-col">
        <DialogHeader class="flex-shrink-0 pb-4">
          <DialogTitle class="text-xl font-semibold">Quote Revisions History</DialogTitle>
          <DialogDescription class="text-muted-foreground">
            View all previous quote revisions and create new ones
          </DialogDescription>
        </DialogHeader>

        <div v-if="isLoading" class="flex-1 flex items-center justify-center">
          <div class="flex flex-col items-center gap-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span class="text-sm text-muted-foreground">Loading revisions...</span>
          </div>
        </div>

        <div v-else-if="quoteRevisionsData" class="flex-1 flex flex-col min-h-0 space-y-4">
          <!-- Summary Header -->
          <div class="flex-shrink-0 bg-muted/50 rounded-lg p-4 border">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-foreground mb-1">
                  Job {{ quoteRevisionsData.job_number }}
                </h4>
                <p class="text-sm text-muted-foreground">
                  {{ quoteRevisionsData.total_revisions }} revision{{
                    quoteRevisionsData.total_revisions !== 1 ? 's' : ''
                  }}
                  total
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-muted-foreground">Current CostSet Rev</p>
                <p class="font-semibold text-foreground">
                  #{{ quoteRevisionsData.current_cost_set_rev }}
                </p>
              </div>
            </div>
          </div>

          <!-- Create New Revision Button -->
          <div class="flex-shrink-0 flex justify-end">
            <Button @click="onCreateNewRevision" :disabled="isCreatingRevision" size="sm">
              <PlusCircle class="w-4 h-4 mr-2" />
              {{ isCreatingRevision ? 'Creating...' : 'Create New Revision' }}
            </Button>
          </div>

          <!-- Revisions List -->
          <div v-if="quoteRevisionsData.revisions.length > 0" class="flex-1 flex flex-col min-h-0">
            <h5 class="flex-shrink-0 font-medium text-foreground mb-3">Previous Revisions</h5>
            <div class="flex-1 overflow-y-auto space-y-3 pr-2">
              <div
                v-for="revision in quoteRevisionsData.revisions"
                :key="revision.quote_revision"
                class="bg-card border rounded-lg p-4 shadow-sm"
              >
                <!-- HEADER -->
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <div class="flex items-center gap-2">
                        <RotateCcw class="w-4 h-4 text-primary" />
                        <span class="font-semibold text-foreground">
                          Revision #{{ revision.quote_revision }}
                        </span>
                      </div>
                      <span class="text-sm text-muted-foreground">
                        {{ revision.archived_at ? formatDate(revision.archived_at) : '—' }}
                      </span>
                    </div>
                  </div>

                  <div class="flex-shrink-0">
                    <Button
                      type="button"
                      @click="onCopyFromRevision(revision)"
                      :disabled="isLoading"
                      size="sm"
                      variant="outline"
                    >
                      <Copy class="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
                <!-- /HEADER -->

                <!-- Reason -->
                <div v-if="revision.reason" class="mb-3 p-3 bg-muted/30 rounded-md">
                  <p class="text-sm">
                    <span class="font-medium">Reason:</span> {{ revision.reason }}
                  </p>
                </div>

                <!-- Summary Stats -->
                <div class="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div class="flex flex-col">
                    <span class="text-muted-foreground text-xs uppercase tracking-wide">Cost</span>
                    <span class="font-semibold text-destructive">
                      {{ formatCurrency(revision.summary.cost) }}
                    </span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-muted-foreground text-xs uppercase tracking-wide"
                      >Revenue</span
                    >
                    <span class="font-semibold text-green-600">
                      {{ formatCurrency(revision.summary.rev) }}
                    </span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-muted-foreground text-xs uppercase tracking-wide">Hours</span>
                    <span class="font-semibold text-primary">
                      {{ formatNumber(revision.summary.hours) }}h
                    </span>
                  </div>
                </div>

                <!-- Cost Lines -->
                <div class="border-t pt-4">
                  <div class="flex items-center justify-between mb-3">
                    <h6 class="text-sm font-medium text-foreground">
                      Cost Lines ({{ revision.cost_lines.length }})
                    </h6>
                  </div>

                  <div class="space-y-2 max-h-40 overflow-y-auto">
                    <div
                      v-for="line in revision.cost_lines"
                      :key="line.id"
                      class="flex items-center justify-between text-sm bg-muted/30 rounded-md p-3"
                    >
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            class="text-xs"
                            :class="
                              line.kind === 'time'
                                ? 'bg-blue-100 text-blue-800'
                                : line.kind === 'material'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-orange-100 text-orange-800'
                            "
                          >
                            {{ line.kind }}
                          </Badge>
                          <span class="font-medium text-foreground truncate">
                            {{ line.desc }}
                          </span>
                        </div>
                      </div>

                      <div class="flex items-center gap-4 text-right flex-shrink-0">
                        <div class="text-center">
                          <div class="text-xs text-muted-foreground uppercase tracking-wide">
                            Qty
                          </div>
                          <div class="font-medium">{{ formatNumber(line.quantity) }}</div>
                        </div>
                        <div class="text-center">
                          <div class="text-xs text-muted-foreground uppercase tracking-wide">
                            Cost
                          </div>
                          <div class="font-medium text-destructive">
                            {{ formatCurrency(line.total_cost) }}
                          </div>
                        </div>
                        <div class="text-center">
                          <div class="text-xs text-muted-foreground uppercase tracking-wide">
                            Rev
                          </div>
                          <div class="font-medium text-green-600">
                            {{ formatCurrency(line.total_rev) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <FileX class="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p class="text-muted-foreground">No previous revisions found</p>
            <p class="text-sm text-muted-foreground/70 mt-1">
              Create your first revision to get started
            </p>
          </div>
        </div>

        <DialogFooter class="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" @click="showQuoteRevisionsModal = false"> Close </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Detailed Summary Dialog -->
    <Dialog :open="showDetailedSummary" @update:open="showDetailedSummary = $event">
      <DialogContent class="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detailed Quote Summary</DialogTitle>
          <DialogDescription>Complete breakdown of quote costs and revenue</DialogDescription>
        </DialogHeader>
        <div class="max-h-[60vh] overflow-y-auto">
          <CostSetSummaryCard
            :key="`quote-summary-detailed-${quoteKey}`"
            title="Quote Summary"
            :summary="currentQuote.quote?.summary"
            :costLines="quoteCostLines"
            :isLoading="isLoading"
            :revision="currentQuote.quote?.rev"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDetailedSummary = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '../../utils/debug'

import { ref, computed, watch, onMounted } from 'vue'
import {
  BookOpen,
  PlusCircle,
  RotateCcw,
  FileX,
  Copy,
  Printer,
  Download,
  ExternalLink,
} from 'lucide-vue-next'
import SmartCostLinesTable from '../shared/SmartCostLinesTable.vue'
import CostSetSummaryCard from '../shared/CostSetSummaryCard.vue'
import { quoteService } from '../../services/quote.service'
import { jobService } from '../../services/job.service'
import { toast } from 'vue-sonner'
import { schemas } from '../../api/generated/api'
import { api } from '../../api/client'
import { z } from 'zod'
import { costlineService } from '../../services/costline.service'
import { useSmartCostLineDelete } from '../../composables/useSmartCostLineDelete'
import CompactSummaryCard from '../shared/CompactSummaryCard.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '../ui/card'

type CostLine = z.infer<typeof schemas.CostLine>
type JobDetailResponse = z.infer<typeof schemas.JobDetailResponse>
type Job = z.infer<typeof schemas.Job>
type CostSet = z.infer<typeof schemas.CostSet>
type PreviewQuoteResponse = z.infer<typeof schemas.PreviewQuoteResponse>
type QuoteRevisionsListResponse = z.infer<typeof schemas.QuoteRevisionsList>

const props = defineProps<{
  jobId: string
  jobData?: Job
}>()

const emit = defineEmits<{
  'cost-line-changed': []
}>()

const currentQuote = computed(() => {
  const jobData = props.jobData

  if (!jobData || !jobData.latest_quote) {
    return { has_quote: false, quote: null }
  }

  // Use API structure exactly as returned - NO CONVERSIONS
  const quote = jobData.latest_quote as CostSet
  return {
    has_quote: true,
    quote: {
      id: quote.id,
      kind: quote.kind,
      rev: quote.rev,
      created: quote.created,
      summary: quote.summary,
      cost_lines: quote.cost_lines || [],
    },
  }
})

const isLoading = ref(false)
const isRefreshing = ref(false)
const showPreviewModal = ref(false)
const showQuoteRevisionsModal = ref(false)
const quoteRevisionsData = ref<QuoteRevisionsListResponse | null>(null)
const isCreatingRevision = ref(false)
const previewData = ref<PreviewQuoteResponse | null>(null)
const costLines = ref<CostLine[]>([])
const quoteKey = ref(0) // Force reactivity key
const showDetailedSummary = ref(false)

// Quote management state
const isCreatingQuote = ref(false)
const isQuoteDeleted = ref(false)
const isDeletingQuote = ref(false)
const isAcceptingQuote = ref(false)

const quoteCostLines = computed(() => {
  const lines = currentQuote.value?.quote?.cost_lines || []
  return lines
})

const hasCostSetQuote = computed(
  () => !!(currentQuote.value?.has_quote && currentQuote.value.quote),
)
const hasXeroQuote = computed(() => !!props.jobData?.quote)
const isQuoteAccepted = computed(() => !!props.jobData?.quote_acceptance_date)
const localQuote = computed(() => props.jobData?.quote ?? null) // Xero

// Check if estimate data is available for copying
const hasEstimateData = computed(() => {
  return !!props.jobData?.latest_estimate?.cost_lines?.length
})

// Check if there are any quote revisions available
const hasQuoteRevisions = computed(() => {
  if (!quoteRevisionsData.value) return false
  return quoteRevisionsData.value.total_revisions > 0
})

// Edits are blocked if quote is accepted AND there are no revisions to unlock it
const areEditsBlocked = computed(() => {
  return isQuoteAccepted.value && !hasQuoteRevisions.value
})

watch(
  () => currentQuote.value.quote?.cost_lines,
  (lines) => {
    if (lines) costLines.value = lines
  },
  { immediate: true },
)

// Watch for quote acceptance to fetch revisions data
watch(
  () => props.jobData?.quote_acceptance_date,
  (acceptanceDate) => {
    if (acceptanceDate && currentQuote.value?.has_quote) {
      // When a quote gets accepted, fetch revisions to check if edits should be blocked
      fetchQuoteRevisions()
    }
  },
  { immediate: true },
)

async function refreshQuoteData() {
  if (!props.jobId) return
  isLoading.value = true

  // 🔍 DEBUG: Log before refresh
  console.log('🔍 REFRESH QUOTE DEBUG - BEFORE:')
  console.log('  - Current quote rev:', currentQuote.value?.quote?.rev)
  console.log('  - Current cost lines count:', costLines.value.length)

  try {
    const response: JobDetailResponse = await api.job_rest_jobs_retrieve({
      params: { job_id: props.jobId },
    })

    if (response.success && response.data) {
      const jobData = response.data

      if (props.jobData) Object.assign(props.jobData, jobData)

      if (jobData.latest_quote) {
        const latestQuote = jobData.latest_quote as CostSet
        if (latestQuote.cost_lines && Array.isArray(latestQuote.cost_lines)) {
          costLines.value = latestQuote.cost_lines
        } else {
          costLines.value = []
        }
      } else {
        costLines.value = []
      }
    }
  } catch (error) {
    toast.error('Failed to refresh quote data')
    debugLog('Failed to refresh quote data:', error)
    console.error('🔍 REFRESH QUOTE DEBUG - ERROR:', error)
  } finally {
    isLoading.value = false
  }
}

async function onApplySpreadsheetChanges() {
  if (!props.jobData?.id) return
  toast.info('Applying changes...', { id: 'quote-apply' })
  try {
    const result = await quoteService.applyQuote(props.jobId)
    if (result.success) {
      toast.success('Changes applied successfully!')
      await refreshQuoteData()
      showPreviewModal.value = false
    } else {
      toast.error('Failed to apply changes')
    }
  } catch {
    toast.error('Error applying changes', { id: 'quote-apply' })
  } finally {
    toast.dismiss('quote-apply')
  }
}

async function printJob() {
  if (!props.jobData?.id) {
    toast.error('Job ID not available')
    return
  }

  try {
    const blob = await jobService.getWorkshopPdf(props.jobData.id)
    const pdfUrl = URL.createObjectURL(blob)

    const printWindow = window.open(pdfUrl, '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
      toast.success('Print dialog opened')
    } else {
      toast.error('Failed to open print window. Please check popup blocker settings.')
    }
  } catch (error) {
    toast.error('Error generating PDF for printing')
    debugLog('Error printing job:', error)
  }
}

async function downloadJobSheet() {
  if (!props.jobData?.id) {
    toast.error('Job ID not available')
    return
  }

  try {
    const blob = await jobService.getWorkshopPdf(props.jobData.id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `job_${props.jobData.job_number}_sheet.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Job sheet download started')
  } catch (error) {
    toast.error('Error generating PDF for download')
    debugLog('Error downloading job sheet:', error)
  }
}

function onShowQuoteRevisions() {
  showQuoteRevisionsModal.value = true
  fetchQuoteRevisions()
}

async function fetchQuoteRevisions() {
  if (!props.jobId) return

  isLoading.value = true
  try {
    const response = await api.job_rest_jobs_cost_sets_quote_revise_retrieve({
      params: { job_id: props.jobId },
    })

    quoteRevisionsData.value = response
  } catch (error) {
    toast.error('Failed to fetch quote revisions')
    debugLog('Failed to fetch quote revisions:', error)
    console.error('🔍 FETCH REVISIONS DEBUG - ERROR:', error)
  } finally {
    isLoading.value = false
  }
}

async function onCreateNewRevision() {
  if (!props.jobId) return
  console.log('onCreateNewRevision jobId:', props.jobId)
  isCreatingRevision.value = true
  toast.info('Creating new quote revision...', { id: 'create-revision' })
  try {
    const response = await api.job_rest_jobs_cost_sets_quote_revise_create(
      { reason: 'Manual revision creation' },
      {
        params: { job_id: props.jobId },
      },
    )

    if (response.success) {
      toast.success(`Quote revision ${response.quote_revision} created successfully!`)
      // Force reactivity update
      quoteKey.value++
      // Refresh data
      await Promise.all([fetchQuoteRevisions(), refreshQuoteData()])
    } else {
      toast.error('Failed to create quote revision')
    }
  } catch (error) {
    toast.error('Error creating quote revision')
    debugLog('Error creating quote revision:', error)
  } finally {
    isCreatingRevision.value = false
    toast.dismiss('create-revision')
  }
}

async function handleAddMaterial(payload: CostLine) {
  if (!payload || payload.kind !== 'material') return
  isLoading.value = true
  toast.info('Adding material cost line...')

  try {
    const createPayload = {
      kind: 'material' as const,
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
      ext_refs: (payload.ext_refs as Record<string, unknown>) || {},
      meta: (payload.meta as Record<string, unknown>) || {},
    }
    const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
    costLines.value = [...costLines.value, created]
    toast.success('Material cost line added!')
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to add material cost line.')
    debugLog('Failed to add material:', error)
  } finally {
    isLoading.value = false
  }
}

// Use the smart delete composable
const { handleSmartDelete } = useSmartCostLineDelete({
  costLines,
  onCostLineChanged: () => emit('cost-line-changed'),
  isLoading,
})

// --- QUOTE METHODS ---
const createQuote = async () => {
  if (!props.jobData?.id || isCreatingQuote.value) return
  isCreatingQuote.value = true
  try {
    const response = await api.api_xero_create_quote_create(undefined, {
      params: { job_id: props.jobData.id },
    })
    if (!response.success) {
      debugLog(response.error || 'Failed to create quote')
      return
    }
    toast.success('Quote created successfully!')
    isQuoteDeleted.value = false
    emit('cost-line-changed')
  } catch (err) {
    debugLog('Error creating quote:', err)
    toast.error('Failed to create quote.')
  } finally {
    isCreatingQuote.value = false
  }
}

const acceptQuote = async () => {
  if (!props.jobData?.id || isAcceptingQuote.value) return
  isAcceptingQuote.value = true
  try {
    const response = await api.job_rest_jobs_quote_accept_create(undefined, {
      params: { job_id: props.jobData.id },
    })
    if (response.success) {
      toast.success('Quote accepted successfully!')
      emit('cost-line-changed')
    } else {
      toast.error('Failed to accept quote')
    }
  } catch (err) {
    debugLog('Error accepting quote:', err)
    toast.error('Failed to accept quote.')
  } finally {
    isAcceptingQuote.value = false
  }
}

const goToQuoteOnXero = () => {
  if (props.jobData?.quote?.online_url && props.jobData.quote.online_url !== '#') {
    window.open(props.jobData.quote.online_url, '_blank')
  }
}

const deleteQuoteOnXero = async () => {
  if (!props.jobData?.id || isDeletingQuote.value) return
  isDeletingQuote.value = true
  try {
    const response = await api.api_xero_delete_quote_destroy(undefined, {
      params: { job_id: props.jobData.id },
    })
    if (!response.success) {
      debugLog(response.error || 'Failed to delete quote')
      return
    }
    isQuoteDeleted.value = true
    toast.success('Quote deleted successfully!')
    emit('cost-line-changed')
  } catch (err) {
    debugLog('Error deleting quote:', err)
    toast.error('Failed to delete quote.')
  } finally {
    isDeletingQuote.value = false
  }
}

// Helper functions for formatting
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-NZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-NZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Add empty line to the grid (UI-only, not persisted until user fills baseline data)
function handleAddEmptyLine() {
  const newLine: CostLine = {
    __localId: crypto.randomUUID(), // Temporary local ID for tracking
    id: '', // empty ID indicates unsaved line
    kind: 'material',
    desc: '',
    quantity: 1,
    unit_cost: 0,
    unit_rev: 0,
    total_cost: 0,
    total_rev: 0,
    ext_refs: {},
    meta: {},
  }
  costLines.value = [...costLines.value, newLine]
}

// Handle creating a new line from an empty line that meets baseline criteria
async function handleCreateFromEmpty(line: CostLine) {
  console.log('Creating cost line from empty line:', line)

  try {
    const createPayload = {
      kind: line.kind as 'material' | 'time' | 'adjust',
      desc: line.desc || '',
      quantity: line.quantity || 1,
      unit_cost: line.unit_cost ?? 0,
      unit_rev: line.unit_rev ?? 0,
      ext_refs: (line.ext_refs as Record<string, unknown>) || {},
      meta: (line.meta as Record<string, unknown>) || {},
    }

    const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)

    // Replace the empty line with the created one
    const index = costLines.value.findIndex((l) => l === line)
    if (index !== -1) {
      costLines.value[index] = created
    }

    emit('cost-line-changed')
    toast.success('Cost line created!')
    console.log('✅ Successfully created cost line:', created)
  } catch (error) {
    toast.error('Failed to create cost line.')
    console.error('❌ Failed to create cost line:', error)
  }
}

// Copy all cost lines from estimate to quote
async function onCopyFromEstimate() {
  if (!props.jobData?.latest_estimate?.cost_lines?.length) {
    toast.error('No estimate data available to copy')
    return
  }

  const estimateLines = props.jobData.latest_estimate.cost_lines
  isLoading.value = true
  toast.info('Copying from estimate...', { id: 'copy-estimate' })

  try {
    // Clear existing quote lines first
    if (costLines.value.length > 0) {
      for (const line of costLines.value) {
        if (line.id) {
          await costlineService.deleteCostLine(line.id)
        }
      }
    }

    // Copy each estimate line to quote
    const createdLines: CostLine[] = []
    for (const estimateLine of estimateLines) {
      const createPayload = {
        kind: estimateLine.kind as 'material' | 'time' | 'adjust',
        desc: estimateLine.desc || '',
        quantity: estimateLine.quantity || 0,
        unit_cost: estimateLine.unit_cost ?? 0,
        unit_rev: estimateLine.unit_rev ?? 0,
        ext_refs: (estimateLine.ext_refs as Record<string, unknown>) || {},
        meta: (estimateLine.meta as Record<string, unknown>) || {},
      }

      const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
      createdLines.push(created)
    }

    // Update local state
    costLines.value = createdLines

    // Refresh quote data to get updated summary
    await refreshQuoteData()

    toast.success(`Copied ${createdLines.length} lines from estimate!`)
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to copy from estimate.')
    debugLog('Failed to copy from estimate:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('copy-estimate')
  }
}

// Copy all cost lines from a specific archived quote revision
async function onCopyFromRevision(revision: { quote_revision: number; cost_lines: CostLine[] }) {
  if (!revision?.cost_lines?.length) {
    toast.error('No cost lines found in this revision')
    return
  }

  if (!quoteRevisionsData.value || quoteRevisionsData.value.total_revisions === 0) {
    toast.error(
      'No archived revisions available. Create a revision first using "Create New Revision".',
    )
    console.warn('🚨 COPY ATTEMPT: No archived revisions exist in summary.revisions[]')
    return
  }

  const revisionLines = revision.cost_lines
  isLoading.value = true
  toast.info(`Copying from archived revision ${revision.quote_revision}...`, {
    id: 'copy-revision',
  })

  try {
    // Clear existing quote lines first
    if (costLines.value.length > 0) {
      for (const line of costLines.value) {
        if (line.id) {
          await costlineService.deleteCostLine(line.id)
        }
      }
      costLines.value = []
    }

    const createdLines: CostLine[] = []
    console.log('🔍 COPY REVISION DEBUG - Creating new lines from archived data...')
    for (const revisionLine of revisionLines) {
      const createPayload = {
        kind: revisionLine.kind as 'material' | 'time' | 'adjust',
        desc: revisionLine.desc || '',
        quantity: revisionLine.quantity || 0,
        unit_cost: revisionLine.unit_cost ?? 0,
        unit_rev: revisionLine.unit_rev ?? 0,
        ext_refs: (revisionLine.ext_refs as Record<string, unknown>) || {},
        meta: (revisionLine.meta as Record<string, unknown>) || {},
      }

      const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
      createdLines.push(created)
      console.log('🔍 COPY REVISION DEBUG - Recreated line from archive:', created.id, created.desc)
    }

    // Update local state
    costLines.value = createdLines
    console.log(
      '🔍 COPY REVISION DEBUG - Successfully restored',
      createdLines.length,
      'lines from archived revision',
    )

    // Only refresh quote data to update summary
    await refreshQuoteData()

    toast.success(
      `Restored ${createdLines.length} lines from archived revision ${revision.quote_revision}!`,
    )
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to copy from archived revision.')
    debugLog('Failed to copy from revision:', error)
    console.error('🔍 COPY REVISION DEBUG - ERROR:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('copy-revision')
  }
}

onMounted(() => {
  console.log('[QUOTE-TAB]: Props ', props.jobData)
})
</script>
