<template>
  <div class="pricing-sections h-full flex flex-col">
    <!-- Costing-based Layout (when feature flag is active and lines provided) -->
    <div v-if="shouldUseCostingDisplay" class="space-y-4 flex-1 min-h-0">
      <div v-for="(categoryLines, categoryName) in groupedCostLines" :key="categoryName" class="pricing-column flex flex-col">
        <PricingSection
          :title="categoryName"
          :lines="categoryLines"
          :visible="true"
          :is-costing-mode="true"
          @refresh="$emit('refresh')"
          class="flex-1 overflow-hidden"
        />
      </div>
    </div>

    <!-- Traditional 3 Column Layout for Pricing Sections (legacy mode) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
      <!-- Estimate Section -->
      <div class="pricing-column flex flex-col">
        <PricingSection
          title="Estimate Pricing"
          :pricing-data="estimatePricing"
          :visible="true"
          @refresh="$emit('refresh')"
          class="flex-1 overflow-hidden"
        />
      </div>

      <!-- Quote Section (only visible for Fixed Price jobs) -->
      <div v-if="showQuoteSection" class="pricing-column flex flex-col">
        <PricingSection
          title="Quote Pricing"
          :pricing-data="quotePricing"
          :visible="showQuoteSection"
          :is-quote="true"
          @refresh="$emit('refresh')"
          class="flex-1 overflow-hidden"
        />
      </div>

      <!-- Reality Section -->
      <div class="pricing-column flex flex-col" :class="{ 'lg:col-span-2': !showQuoteSection }">
        <PricingSection
          title="Reality Pricing"
          :pricing-data="realityPricing"
          :visible="true"
          :show-two-columns="!showQuoteSection"
          @refresh="$emit('refresh')"
          class="flex-1 overflow-hidden"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { JobDetail, JobPricing } from '@/schemas/job.schemas'
import type { CostLine } from '@/types/costing.types'
import { useFeatureFlags } from '@/stores/feature-flags'
import { useCostingStore } from '@/stores/costing'
import PricingSection from './PricingSection.vue'

interface Props {
  jobData?: JobDetail | null
  lines?: CostLine[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  refresh: []
}>()

// Stores
const featureFlags = useFeatureFlags()
const costingStore = useCostingStore()

// Early return pattern for feature flag check
const shouldUseCostingDisplay = computed(() => {
  return featureFlags.isCostingApiEnabled && props.lines && props.lines.length > 0
})

// Group costing lines by category with fallback
const groupedCostLines = computed(() => {
  if (!shouldUseCostingDisplay.value || !props.lines) {
    return {}
  }

  return groupLinesByCategory(props.lines)
})

// Helper function following SRP principle
const groupLinesByCategory = (lines: CostLine[]): Record<string, CostLine[]> => {
  return lines.reduce((groups, line) => {
    const category = getCategoryFromLine(line)

    if (!groups[category]) {
      groups[category] = []
    }

    groups[category].push(line)
    return groups
  }, {} as Record<string, CostLine[]>)
}

// Category extraction with fallback - centralized logic
const getCategoryFromLine = (line: CostLine): string => {
  return line.meta?.category ?? 'Main Work'
}

// Computed properties for traditional pricing (legacy mode)
const showQuoteSection = computed(() => {
  return props.jobData?.pricing_methodology === 'fixed_price'
})

const estimatePricing = computed(() => {
  return props.jobData?.latest_estimate_pricing || null
})

const quotePricing = computed(() => {
  return props.jobData?.latest_quote_pricing || null
})

const realityPricing = computed(() => {
  return props.jobData?.latest_reality_pricing || null
})
</script>

<style scoped>
.pricing-sections {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pricing-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

/* Ensure pricing sections use all available space */
.pricing-column :deep(.pricing-section) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.pricing-column :deep(.pricing-content) {
  flex: 1;
  overflow-y: auto;
}

/* Responsive for mobile devices */
@media (max-width: 1023px) {
  .pricing-sections {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .pricing-column {
    height: auto;
    min-height: 300px;
    margin-bottom: 1rem;
  }

  .pricing-column :deep(.pricing-section) {
    height: 300px;
  }
}
</style>
