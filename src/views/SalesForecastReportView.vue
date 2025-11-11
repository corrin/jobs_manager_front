<template>
  <AppLayout>
    <div class="w-full h-full flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto p-0">
        <div class="max-w-7xl mx-auto py-8 px-2 md:px-8 h-full flex flex-col gap-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-3xl font-extrabold text-indigo-700 flex items-center gap-3">
              <TrendingUp class="w-8 h-8 text-indigo-400" />
              Sales Forecast Report
            </h1>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                @click="exportToCsv"
                :disabled="loading || !months.length"
                class="text-sm px-4 py-2"
              >
                <Download class="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="default"
                @click="refreshData"
                :disabled="loading"
                class="text-sm px-4 py-2"
              >
                <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
                Refresh
              </Button>
            </div>
          </div>

          <!-- Description -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Info class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-1">About This Report</p>
                <p>
                  Compares Xero invoice totals vs Job Manager revenue attribution by month to
                  identify unbilled work, revenue forecasting discrepancies, and invoicing patterns.
                </p>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div
            v-if="error"
            class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-red-800">
              <p class="font-medium">Error Loading Data</p>
              <p>{{ error }}</p>
            </div>
          </div>

          <!-- Summary Cards -->
          <div v-if="summary" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Xero Sales</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ formatCurrency(summary.totalXeroSales) }}
                  </p>
                </div>
                <FileText class="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total JM Sales</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {{ formatCurrency(summary.totalJmSales) }}
                  </p>
                </div>
                <DollarSign class="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Total Variance</p>
                  <p
                    class="text-2xl font-bold"
                    :class="summary.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ formatCurrency(summary.totalVariance) }}
                  </p>
                </div>
                <TrendingUp
                  class="h-8 w-8"
                  :class="summary.totalVariance >= 0 ? 'text-green-500' : 'text-red-500'"
                />
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">Avg Variance %</p>
                  <p
                    class="text-2xl font-bold"
                    :class="summary.avgVariancePct >= 0 ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ formatPercentage(summary.avgVariancePct) }}
                  </p>
                </div>
                <BarChart3
                  class="h-8 w-8"
                  :class="summary.avgVariancePct >= 0 ? 'text-green-500' : 'text-red-500'"
                />
              </div>
            </div>
          </div>

          <!-- Data Table -->
          <div v-if="!loading && months.length > 0" class="flex-1 overflow-hidden flex flex-col">
            <div
              class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col"
            >
              <div class="overflow-x-auto flex-1">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50 sticky top-0">
                    <tr>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Month
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Xero Sales
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        JM Sales
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Variance
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Variance %
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="month in months" :key="month.month" class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {{ month.month_label }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {{ formatCurrency(month.xero_sales) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {{ formatCurrency(month.jm_sales) }}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium"
                        :class="month.variance >= 0 ? 'text-green-600' : 'text-red-600'"
                      >
                        {{ formatCurrency(month.variance) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                          :class="getVarianceBadgeClass(month.variance_pct)"
                        >
                          {{ formatPercentage(month.variance_pct) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!loading && months.length === 0"
            class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center"
          >
            <TrendingUp class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">No sales data available</h3>
            <p class="mt-1 text-sm text-gray-500">
              No sales data found. Try refreshing or check your data sources.
            </p>
          </div>

          <!-- Loading State -->
          <div
            v-if="loading"
            class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center"
          >
            <RefreshCw class="mx-auto h-12 w-12 text-gray-400 animate-spin" />
            <p class="mt-2 text-sm text-gray-500">Loading sales forecast data...</p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  TrendingUp,
  Download,
  RefreshCw,
  DollarSign,
  AlertCircle,
  Info,
  FileText,
  BarChart3,
} from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { salesForecastReportService } from '@/services/sales-forecast-report.service'
import type { SalesForecastMonth } from '@/types/sales-forecast.types'

const loading = ref(false)
const error = ref<string | null>(null)
const months = ref<SalesForecastMonth[]>([])

const summary = computed(() => {
  if (months.value.length === 0) return null

  const totalXeroSales = months.value.reduce((sum, m) => sum + m.xero_sales, 0)
  const totalJmSales = months.value.reduce((sum, m) => sum + m.jm_sales, 0)
  const totalVariance = months.value.reduce((sum, m) => sum + m.variance, 0)
  const avgVariancePct =
    months.value.reduce((sum, m) => sum + m.variance_pct, 0) / months.value.length

  return {
    totalXeroSales,
    totalJmSales,
    totalVariance,
    avgVariancePct,
  }
})

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`
}

const getVarianceBadgeClass = (variancePct: number): string => {
  if (Math.abs(variancePct) < 10) {
    return 'bg-green-100 text-green-800'
  } else if (Math.abs(variancePct) < 25) {
    return 'bg-yellow-100 text-yellow-800'
  } else {
    return 'bg-red-100 text-red-800'
  }
}

const loadData = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await salesForecastReportService.getSalesForecast()
    months.value = response.months
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load sales forecast data'
    months.value = []
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadData()
}

const exportToCsv = () => {
  if (months.value.length === 0) return

  const headers = ['Month', 'Xero Sales', 'JM Sales', 'Variance', 'Variance %']
  const rows = months.value.map((m) => [
    m.month_label,
    m.xero_sales.toFixed(2),
    m.jm_sales.toFixed(2),
    m.variance.toFixed(2),
    m.variance_pct.toFixed(1),
  ])

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `sales-forecast-report-${new Date().toISOString().split('T')[0]}.csv`,
  )
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  loadData()
})
</script>
