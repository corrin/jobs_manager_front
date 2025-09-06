<template>
  <div class="space-y-4">
    <!-- Progress Bar -->
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div
        class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        :style="{ width: `${progressPercent}%` }"
      ></div>
    </div>

    <!-- Current Stage -->
    <div class="flex items-center gap-3">
      <div class="flex-shrink-0">
        <div
          v-if="isProcessing"
          class="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"
        ></div>
        <CheckCircle2 v-else-if="isComplete" class="h-5 w-5 text-green-600" />
        <XCircle v-else-if="hasError" class="h-5 w-5 text-red-600" />
      </div>

      <div class="flex-1">
        <p class="text-sm font-medium" :class="statusTextClass">
          {{ currentStageText }}
        </p>
        <p v-if="currentStageDescription" class="text-xs text-gray-500 mt-1">
          {{ currentStageDescription }}
        </p>
      </div>
    </div>

    <!-- Stages List -->
    <div class="space-y-2">
      <div
        v-for="stage in stages"
        :key="stage.id"
        class="flex items-center gap-3 py-2"
        :class="getStageClasses(stage.id)"
      >
        <div class="flex-shrink-0">
          <CheckCircle2 v-if="isStageComplete(stage.id)" class="h-4 w-4 text-green-600" />
          <div
            v-else-if="isStageActive(stage.id)"
            class="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"
          ></div>
          <div v-else class="h-4 w-4 rounded-full border-2 border-gray-300"></div>
        </div>

        <div class="flex-1">
          <p class="text-sm" :class="getStageTextClass(stage.id)">
            {{ stage.label }}
          </p>
          <p v-if="stage.description && isStageActive(stage.id)" class="text-xs text-gray-500 mt-1">
            {{ stage.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Statistics (shown on completion) -->
    <div
      v-if="statistics && isComplete"
      class="mt-4 p-4 bg-green-50 rounded-lg border border-green-200"
    >
      <h4 class="text-sm font-medium text-green-800 mb-2">Processing Complete</h4>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Extracted:</span>
          <span class="font-medium ml-1">{{ statistics.total_extracted }}</span>
        </div>
        <div>
          <span class="text-gray-600">Valid:</span>
          <span class="font-medium ml-1">{{ statistics.total_valid }}</span>
        </div>
        <div>
          <span class="text-gray-600">Imported:</span>
          <span class="font-medium ml-1 text-green-600">{{ statistics.imported }}</span>
        </div>
        <div>
          <span class="text-gray-600">Updated:</span>
          <span class="font-medium ml-1 text-blue-600">{{ statistics.updated }}</span>
        </div>
        <div>
          <span class="text-gray-600">Skipped:</span>
          <span class="font-medium ml-1 text-yellow-600">{{ statistics.skipped }}</span>
        </div>
        <div>
          <span class="text-gray-600">Failed:</span>
          <span class="font-medium ml-1 text-red-600">{{ statistics.failed }}</span>
        </div>
      </div>
    </div>

    <!-- Warnings -->
    <div
      v-if="warnings.length > 0"
      class="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
    >
      <h4 class="text-sm font-medium text-yellow-800 mb-2">Warnings ({{ warnings.length }})</h4>
      <ul class="text-sm text-yellow-700 space-y-1">
        <li
          v-for="(warning, index) in warnings.slice(0, 3)"
          :key="index"
          class="flex items-start gap-2"
        >
          <AlertTriangle class="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{{ warning }}</span>
        </li>
        <li v-if="warnings.length > 3" class="text-xs text-yellow-600 italic">
          ... and {{ warnings.length - 3 }} more warnings
        </li>
      </ul>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
      <h4 class="text-sm font-medium text-red-800 mb-2">Processing Failed</h4>
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-vue-next'

interface ProcessingStage {
  id: string
  label: string
  description?: string
}

interface ProcessingStatistics {
  total_extracted: number
  total_valid: number
  imported: number
  updated: number
  skipped: number
  failed: number
}

interface Props {
  stage: string
  error?: string | null
  warnings?: string[]
  statistics?: ProcessingStatistics | null
}

const props = withDefaults(defineProps<Props>(), {
  stage: 'uploading',
  error: null,
  warnings: () => [],
  statistics: null,
})

const stages: ProcessingStage[] = [
  {
    id: 'uploading',
    label: 'Uploading file',
    description: 'Transferring PDF to server...',
  },
  {
    id: 'extracting',
    label: 'Extracting data',
    description: 'Analyzing PDF with AI to extract product information...',
  },
  {
    id: 'validating',
    label: 'Validating data',
    description: 'Checking extracted data for completeness and accuracy...',
  },
  {
    id: 'importing',
    label: 'Importing to database',
    description: 'Saving products and updating supplier information...',
  },
  {
    id: 'complete',
    label: 'Processing complete',
    description: 'All products have been successfully processed.',
  },
]

const progressPercent = computed(() => {
  const stageIndex = stages.findIndex((s) => s.id === props.stage)
  if (stageIndex === -1) return 0

  if (props.error) {
    return Math.max(20, (stageIndex / stages.length) * 100)
  }

  if (props.stage === 'complete') return 100
  return ((stageIndex + 1) / stages.length) * 100
})

const isProcessing = computed(() => {
  return !props.error && props.stage !== 'complete'
})

const isComplete = computed(() => {
  return props.stage === 'complete' && !props.error
})

const hasError = computed(() => {
  return !!props.error
})

const currentStageText = computed(() => {
  const stage = stages.find((s) => s.id === props.stage)
  if (props.error) {
    return `Failed during ${stage?.label?.toLowerCase() || 'processing'}`
  }
  return stage?.label || 'Processing...'
})

const currentStageDescription = computed(() => {
  if (props.error) return null
  const stage = stages.find((s) => s.id === props.stage)
  return stage?.description || null
})

const statusTextClass = computed(() => {
  if (props.error) return 'text-red-600'
  if (props.stage === 'complete') return 'text-green-600'
  return 'text-blue-600'
})

function isStageComplete(stageId: string): boolean {
  const currentIndex = stages.findIndex((s) => s.id === props.stage)
  const stageIndex = stages.findIndex((s) => s.id === stageId)

  if (props.error) {
    return stageIndex < currentIndex
  }

  return props.stage === 'complete' ? true : stageIndex < currentIndex
}

function isStageActive(stageId: string): boolean {
  return props.stage === stageId && !props.error
}

function getStageClasses(stageId: string): string {
  if (isStageComplete(stageId)) {
    return 'opacity-75'
  }
  if (isStageActive(stageId)) {
    return 'bg-blue-50 rounded px-3 py-1'
  }
  return 'opacity-50'
}

function getStageTextClass(stageId: string): string {
  if (isStageComplete(stageId)) {
    return 'text-green-600 font-medium'
  }
  if (isStageActive(stageId)) {
    return 'text-blue-600 font-medium'
  }
  return 'text-gray-500'
}
</script>
