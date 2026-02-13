<template>
  <AppLayout>
    <div class="w-full h-full flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto p-0">
        <div class="max-w-7xl mx-auto py-8 px-2 md:px-8 flex flex-col gap-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-3xl font-extrabold text-indigo-700 flex items-center gap-3">
              <TrendingUp class="w-8 h-8 text-indigo-400" />
              Job Profitability Report
            </h1>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                @click="exportReport"
                :disabled="loading || !jobs.length"
                class="text-sm px-4 py-2"
              >
                <Download class="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="default"
                @click="loadData"
                :disabled="loading"
                class="text-sm px-4 py-2"
              >
                <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
                Refresh
              </Button>
            </div>
          </div>

          <!-- Filters -->
          <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div class="flex flex-wrap items-end gap-4">
              <div class="flex items-center gap-2">
                <label for="start-date" class="text-sm font-medium text-gray-700">
                  Start Date:
                </label>
                <input
                  id="start-date"
                  v-model="filters.startDate"
                  type="date"
                  class="rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div class="flex items-center gap-2">
                <label for="end-date" class="text-sm font-medium text-gray-700"> End Date: </label>
                <input
                  id="end-date"
                  v-model="filters.endDate"
                  type="date"
                  class="rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div class="flex items-center gap-2">
                <label for="min-value" class="text-sm font-medium text-gray-700">
                  Min Value:
                </label>
                <input
                  id="min-value"
                  v-model.number="filters.minValue"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Any"
                  class="w-28 rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div class="flex items-center gap-2">
                <label for="max-value" class="text-sm font-medium text-gray-700">
                  Max Value:
                </label>
                <input
                  id="max-value"
                  v-model.number="filters.maxValue"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Any"
                  class="w-28 rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div class="flex items-center gap-2">
                <label for="pricing-type" class="text-sm font-medium text-gray-700">
                  Pricing Type:
                </label>
                <select
                  id="pricing-type"
                  v-model="filters.pricingType"
                  class="rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All</option>
                  <option value="time_materials">Time &amp; Materials</option>
                  <option value="fixed_price">Fixed Price</option>
                </select>
              </div>
              <Button variant="default" size="sm" @click="loadData" :disabled="loading">
                Apply Filters
              </Button>
            </div>
            <div class="flex gap-2 mt-3">
              <Button variant="outline" size="sm" @click="setDateRange('thisFinancialYear')">
                This Financial Year
              </Button>
              <Button variant="outline" size="sm" @click="setDateRange('lastFinancialYear')">
                Last Financial Year
              </Button>
              <Button variant="outline" size="sm" @click="setDateRange('thisQuarter')">
                This Quarter
              </Button>
              <Button variant="outline" size="sm" @click="setDateRange('last6Months')">
                Last 6 Months
              </Button>
            </div>
          </div>

          <!-- Summary Stats -->
          <div
            v-if="summary && !loading"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
          >
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p class="text-2xl font-bold text-gray-900">{{ summary.total_jobs }}</p>
                </div>
                <BarChart3 class="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ formatCurrency(Number(summary.total_revenue)) }}
                  </p>
                </div>
                <DollarSign class="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Profit</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ formatCurrency(Number(summary.total_profit)) }}
                  </p>
                </div>
                <TrendingUp class="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Overall Margin</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ Number(summary.overall_margin).toFixed(1) }}%
                  </p>
                </div>
                <Percent class="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Profitable / Unprofitable</p>
                  <p class="text-2xl font-bold text-gray-900">
                    <span class="text-green-600">{{ summary.profitable_jobs }}</span>
                    /
                    <span class="text-red-600">{{ summary.unprofitable_jobs }}</span>
                  </p>
                </div>
                <CheckCircle class="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Variance</p>
                  <p
                    class="text-2xl font-bold"
                    :class="Number(summary.total_variance) >= 0 ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ formatCurrency(Number(summary.total_variance)) }}
                  </p>
                </div>
                <TrendingDown
                  v-if="Number(summary.total_variance) < 0"
                  class="h-8 w-8 text-red-500"
                />
                <TrendingUp v-else class="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <RefreshCw class="h-8 w-8 animate-spin text-indigo-500" />
            <span class="ml-2 text-lg text-gray-600">Loading profitability data...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-red-400 mr-2" />
              <span class="text-red-800">{{ error }}</span>
            </div>
          </div>

          <!-- Data Table -->
          <div
            v-else-if="jobs.length > 0"
            class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
          >
            <div class="px-4 py-5 sm:p-6">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('job_number')"
                      >
                        <div class="flex items-center gap-1">
                          Job #
                          <span v-if="sortColumn === 'job_number'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('client_name')"
                      >
                        <div class="flex items-center gap-1">
                          Client
                          <span v-if="sortColumn === 'client_name'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('pricing_type')"
                      >
                        <div class="flex items-center gap-1">
                          Type
                          <span v-if="sortColumn === 'pricing_type'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('completion_date')"
                      >
                        <div class="flex items-center gap-1">
                          Completed
                          <span v-if="sortColumn === 'completion_date'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('job_value')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Job Value
                          <span v-if="sortColumn === 'job_value'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('estimate_revenue')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Est. Revenue
                          <span v-if="sortColumn === 'estimate_revenue'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('estimate_cost')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Est. Cost
                          <span v-if="sortColumn === 'estimate_cost'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('quote_revenue')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Quote Revenue
                          <span v-if="sortColumn === 'quote_revenue'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('quote_cost')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Quote Cost
                          <span v-if="sortColumn === 'quote_cost'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('actual_revenue')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Actual Revenue
                          <span v-if="sortColumn === 'actual_revenue'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('actual_cost')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Actual Cost
                          <span v-if="sortColumn === 'actual_cost'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('baseline_profit')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Est. Profit
                          <span v-if="sortColumn === 'baseline_profit'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('actual_profit')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Actual Profit
                          <span v-if="sortColumn === 'actual_profit'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('actual_margin')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Margin %
                          <span v-if="sortColumn === 'actual_margin'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                      <th
                        class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        @click="handleSort('profit_variance')"
                      >
                        <div class="flex items-center justify-end gap-1">
                          Variance
                          <span v-if="sortColumn === 'profit_variance'" class="text-slate-500">
                            {{ sortDirection === 'asc' ? '↑' : '↓' }}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="job in sortedJobs" :key="job.job_id" class="hover:bg-gray-50">
                      <td class="px-4 py-4 whitespace-nowrap text-sm">
                        <router-link
                          :to="`/jobs/${job.job_id}`"
                          class="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          {{ job.job_number }}
                        </router-link>
                        <div class="text-xs text-gray-500 max-w-[200px] truncate">
                          {{ job.job_name }}
                        </div>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ job.client_name }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          class="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full"
                          :class="
                            job.pricing_type === 'time_materials'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-purple-100 text-purple-800'
                          "
                        >
                          {{ job.pricing_type_display }}
                        </span>
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ job.completion_date }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {{ formatCurrency(Number(job.job_value)) }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {{ formatCurrency(Number(job.estimate.revenue)) }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {{ formatCurrency(Number(job.estimate.cost)) }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {{ formatCurrency(Number(job.quote.revenue)) }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {{ formatCurrency(Number(job.quote.cost)) }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {{ formatCurrency(Number(job.actual.revenue)) }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {{ formatCurrency(Number(job.actual.cost)) }}
                      </td>
                      <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {{ formatCurrency(Number(baselineProfit(job))) }}
                      </td>
                      <td
                        class="px-4 py-4 whitespace-nowrap text-sm font-medium text-right"
                        :class="Number(job.actual.profit) >= 0 ? 'text-green-600' : 'text-red-600'"
                      >
                        {{ formatCurrency(Number(job.actual.profit)) }}
                      </td>
                      <td
                        class="px-4 py-4 whitespace-nowrap text-sm font-medium text-right"
                        :class="Number(job.actual.margin) >= 0 ? 'text-green-600' : 'text-red-600'"
                      >
                        {{ Number(job.actual.margin).toFixed(1) }}%
                      </td>
                      <td
                        class="px-4 py-4 whitespace-nowrap text-sm font-medium text-right"
                        :class="
                          Number(job.profit_variance) >= 0 ? 'text-green-600' : 'text-red-600'
                        "
                      >
                        {{ formatCurrency(Number(job.profit_variance)) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
            <TrendingUp class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">No profitability data</h3>
            <p class="mt-1 text-sm text-gray-500">
              No completed jobs found for the selected filters. Try adjusting the date range or
              other criteria.
            </p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  DollarSign,
  BarChart3,
  AlertCircle,
  Percent,
  CheckCircle,
} from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import axios from '@/plugins/axios'
import { formatCurrency, exportToCsv } from '@/utils/string-formatting'
import { toLocalDateString } from '@/utils/dateUtils'
import { toast } from 'vue-sonner'

interface ProfitabilityBreakdown {
  revenue: string
  cost: string
  profit: string
  margin: string
  hours: string
}

interface JobProfitability {
  job_id: string
  job_number: number
  job_name: string
  client_name: string
  pricing_type: string
  pricing_type_display: string
  completion_date: string
  job_value: string
  estimate: ProfitabilityBreakdown
  quote: ProfitabilityBreakdown
  actual: ProfitabilityBreakdown
  profit_variance: string
  profit_variance_pct: string
}

interface ProfitabilitySummary {
  total_jobs: number
  total_revenue: string
  total_cost: string
  total_profit: string
  overall_margin: string
  avg_profit_per_job: string
  total_baseline_profit: string
  total_actual_profit: string
  total_variance: string
  tm_jobs: number
  fp_jobs: number
  profitable_jobs: number
  unprofitable_jobs: number
}

const loading = ref(false)
const error = ref<string | null>(null)
const jobs = ref<JobProfitability[]>([])
const summary = ref<ProfitabilitySummary | null>(null)

const filters = ref({
  startDate: '',
  endDate: '',
  minValue: null as number | null,
  maxValue: null as number | null,
  pricingType: '',
})

type SortableColumn =
  | 'job_number'
  | 'client_name'
  | 'pricing_type'
  | 'completion_date'
  | 'job_value'
  | 'estimate_revenue'
  | 'estimate_cost'
  | 'quote_revenue'
  | 'quote_cost'
  | 'actual_revenue'
  | 'actual_cost'
  | 'baseline_profit'
  | 'actual_profit'
  | 'actual_margin'
  | 'profit_variance'

const sortColumn = ref<SortableColumn | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

/** For T&M jobs use estimate.profit, for Fixed Price use quote.profit */
const baselineProfit = (job: JobProfitability): string =>
  job.pricing_type === 'time_materials' ? job.estimate.profit : job.quote.profit

const getSortValue = (job: JobProfitability, col: SortableColumn): string | number => {
  switch (col) {
    case 'baseline_profit':
      return Number(baselineProfit(job))
    case 'actual_profit':
      return Number(job.actual.profit)
    case 'actual_margin':
      return Number(job.actual.margin)
    case 'job_number':
      return job.job_number
    case 'job_value':
      return Number(job.job_value)
    case 'estimate_revenue':
      return Number(job.estimate.revenue)
    case 'estimate_cost':
      return Number(job.estimate.cost)
    case 'quote_revenue':
      return Number(job.quote.revenue)
    case 'quote_cost':
      return Number(job.quote.cost)
    case 'actual_revenue':
      return Number(job.actual.revenue)
    case 'actual_cost':
      return Number(job.actual.cost)
    case 'profit_variance':
      return Number(job.profit_variance)
    default:
      return job[col] ?? ''
  }
}

const sortedJobs = computed(() => {
  if (!sortColumn.value) return jobs.value

  return [...jobs.value].sort((a, b) => {
    const col = sortColumn.value as SortableColumn
    const aVal = getSortValue(a, col)
    const bVal = getSortValue(b, col)

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
    }

    const comparison = String(aVal).localeCompare(String(bVal))
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

const handleSort = (column: SortableColumn) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const getFinancialYearStart = (date: Date): Date => {
  const year = date.getFullYear()
  const month = date.getMonth()
  // NZ financial year starts July 1
  return month >= 6 ? new Date(year, 6, 1) : new Date(year - 1, 6, 1)
}

const setDateRange = (
  period: 'thisFinancialYear' | 'lastFinancialYear' | 'thisQuarter' | 'last6Months',
) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  switch (period) {
    case 'thisFinancialYear': {
      const fyStart = getFinancialYearStart(now)
      filters.value.startDate = toLocalDateString(fyStart)
      filters.value.endDate = toLocalDateString(now)
      break
    }
    case 'lastFinancialYear': {
      const thisFyStart = getFinancialYearStart(now)
      const lastFyStart = new Date(thisFyStart.getFullYear() - 1, 6, 1)
      const lastFyEnd = new Date(thisFyStart.getFullYear(), 5, 30)
      filters.value.startDate = toLocalDateString(lastFyStart)
      filters.value.endDate = toLocalDateString(lastFyEnd)
      break
    }
    case 'thisQuarter': {
      const quarterStart = Math.floor(month / 3) * 3
      filters.value.startDate = toLocalDateString(new Date(year, quarterStart, 1))
      filters.value.endDate = toLocalDateString(new Date(year, quarterStart + 3, 0))
      break
    }
    case 'last6Months': {
      filters.value.startDate = toLocalDateString(new Date(year, month - 6, 1))
      filters.value.endDate = toLocalDateString(now)
      break
    }
  }
  loadData()
}

const loadData = async () => {
  if (!filters.value.startDate || !filters.value.endDate) return

  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams()
    params.append('start_date', filters.value.startDate)
    params.append('end_date', filters.value.endDate)
    if (filters.value.minValue != null) {
      params.append('min_value', String(filters.value.minValue))
    }
    if (filters.value.maxValue != null) {
      params.append('max_value', String(filters.value.maxValue))
    }
    if (filters.value.pricingType) {
      params.append('pricing_type', filters.value.pricingType)
    }

    const response = await axios.get<{
      jobs: JobProfitability[]
      summary: ProfitabilitySummary
    }>(`/job/rest/reports/job-profitability/?${params.toString()}`)

    jobs.value = response.data.jobs
    summary.value = response.data.summary
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load profitability data'
    jobs.value = []
    summary.value = null
    toast.error('Failed to load profitability report')
  } finally {
    loading.value = false
  }
}

const exportReport = () => {
  if (!jobs.value.length) return

  const headers = [
    'Job Number',
    'Job Name',
    'Client',
    'Pricing Type',
    'Completion Date',
    'Job Value',
    'Est. Revenue',
    'Est. Cost',
    'Est. Profit',
    'Est. Margin %',
    'Est. Hours',
    'Quote Revenue',
    'Quote Cost',
    'Quote Profit',
    'Quote Margin %',
    'Quote Hours',
    'Actual Revenue',
    'Actual Cost',
    'Actual Profit',
    'Actual Margin %',
    'Actual Hours',
    'Variance',
    'Variance %',
  ]

  const rows = jobs.value.map((job) => [
    job.job_number,
    job.job_name,
    job.client_name,
    job.pricing_type_display,
    job.completion_date,
    job.job_value,
    job.estimate.revenue,
    job.estimate.cost,
    job.estimate.profit,
    job.estimate.margin,
    job.estimate.hours,
    job.quote.revenue,
    job.quote.cost,
    job.quote.profit,
    job.quote.margin,
    job.quote.hours,
    job.actual.revenue,
    job.actual.cost,
    job.actual.profit,
    job.actual.margin,
    job.actual.hours,
    job.profit_variance,
    job.profit_variance_pct,
  ])

  exportToCsv(headers, rows, `job-profitability-report-${toLocalDateString()}`)
  toast.success('Report exported successfully')
}

onMounted(() => {
  setDateRange('thisFinancialYear')
})
</script>
