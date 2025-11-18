<template>
  <AppLayout>
    <div class="p-4 md:p-8 space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <Users class="w-6 h-6 text-indigo-600" />
          Clients
        </h1>
        <Button @click="openCreateModal">
          <PlusCircle class="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search clients by name, email, or phone..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          @input="onSearchInput"
        />
      </div>

      <!-- Loading State -->
      <div v-if="clientStore.isLoading" class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-indigo-600" />
        <span class="ml-3 text-gray-600">Loading clients...</span>
      </div>

      <!-- No Clients -->
      <div v-else-if="!clientStore.hasClients" class="text-center py-12 text-gray-500">
        <Users class="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p class="text-lg font-medium">No clients yet</p>
        <p class="text-sm">Click "New Client" to add your first client</p>
      </div>

      <!-- No Results after filtering -->
      <div v-else-if="filteredResults.length === 0" class="text-center py-12 text-gray-500">
        <Search class="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p class="text-lg font-medium">No clients found</p>
        <p class="text-sm">Try a different search term</p>
      </div>

      <!-- Results Table -->
      <div v-else class="space-y-4">
        <div class="text-sm text-gray-600">
          {{
            searchQuery ? `Found ${filteredResults.length}` : `Showing ${filteredResults.length}`
          }}
          client{{ filteredResults.length !== 1 ? 's' : '' }}
        </div>

        <div class="overflow-y-auto max-h-[70vh] rounded-2xl shadow-lg border border-gray-200">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 border-b sticky top-0">
              <tr>
                <th class="p-3 text-left">
                  <button
                    @click="toggleSort('name')"
                    class="flex items-center gap-1 font-semibold text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    Client Name
                    <ArrowUpDown v-if="sortField !== 'name'" class="w-4 h-4" />
                    <ArrowUp v-else-if="sortDirection === 'asc'" class="w-4 h-4 text-indigo-600" />
                    <ArrowDown v-else class="w-4 h-4 text-indigo-600" />
                  </button>
                </th>
                <th class="p-3 text-left font-semibold text-gray-700">Email</th>
                <th class="p-3 text-left font-semibold text-gray-700">Phone</th>
                <th class="p-3 text-left">
                  <button
                    @click="toggleSort('total_spend')"
                    class="flex items-center gap-1 font-semibold text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    Total Spend
                    <ArrowUpDown v-if="sortField !== 'total_spend'" class="w-4 h-4" />
                    <ArrowUp v-else-if="sortDirection === 'asc'" class="w-4 h-4 text-indigo-600" />
                    <ArrowDown v-else class="w-4 h-4 text-indigo-600" />
                  </button>
                </th>
                <th class="p-3 text-left">
                  <button
                    @click="toggleSort('last_invoice_date')"
                    class="flex items-center gap-1 font-semibold text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    Last Invoice
                    <ArrowUpDown v-if="sortField !== 'last_invoice_date'" class="w-4 h-4" />
                    <ArrowUp v-else-if="sortDirection === 'asc'" class="w-4 h-4 text-indigo-600" />
                    <ArrowDown v-else class="w-4 h-4 text-indigo-600" />
                  </button>
                </th>
                <th class="p-3 text-left font-semibold text-gray-700">Type</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="client in pagedResults"
                :key="client.id"
                class="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                @click="navigateToClient(client.id)"
              >
                <td class="p-3 font-medium text-gray-900">
                  {{ client.name }}
                </td>
                <td class="p-3 text-gray-600">
                  {{ client.email || '-' }}
                </td>
                <td class="p-3 text-gray-600">
                  {{ client.phone || '-' }}
                </td>
                <td class="p-3 text-gray-900 font-medium">
                  {{ client.total_spend || '$0.00' }}
                </td>
                <td class="p-3 text-gray-600">
                  {{ client.last_invoice_date || '-' }}
                </td>
                <td class="p-3">
                  <Badge :variant="client.is_account_customer ? 'default' : 'secondary'">
                    {{ client.is_account_customer ? 'Account' : 'Cash' }}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="totalPages > 1"
          v-model:page="currentPage"
          :total="totalPages"
          :sibling-count="1"
        />
      </div>
    </div>

    <!-- Create Client Modal -->
    <CreateClientModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @client-created="handleClientCreated"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClientStore } from '@/stores/clientStore'
import AppLayout from '@/components/AppLayout.vue'
import CreateClientModal from '@/components/CreateClientModal.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Pagination from '@/components/ui/pagination/Pagination.vue'
import {
  Users,
  Search,
  PlusCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const router = useRouter()
const clientStore = useClientStore()

// Search state
const searchQuery = ref('')

// Modal state
const isCreateModalOpen = ref(false)

// Pagination state
const currentPage = ref(1)
const pageSize = 11

// Sorting state
type SortField = 'name' | 'total_spend' | 'last_invoice_date'
type SortDirection = 'asc' | 'desc' | null
const sortField = ref<SortField | null>(null)
const sortDirection = ref<SortDirection>(null)

// Computed properties
const filteredResults = computed(() => {
  let results = clientStore.allClients

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    results = results.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query),
    )
  }

  // Apply sorting
  if (sortField.value && sortDirection.value) {
    results = [...results].sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      if (sortField.value === 'name') {
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
      } else if (sortField.value === 'total_spend') {
        // Parse currency string: "$1,234.56" -> 1234.56
        aVal = parseFloat(a.total_spend?.replace(/[$,]/g, '') || '0')
        bVal = parseFloat(b.total_spend?.replace(/[$,]/g, '') || '0')
      } else if (sortField.value === 'last_invoice_date') {
        // Parse datetime strings, treat null as very old date
        aVal = a.last_invoice_date ? new Date(a.last_invoice_date).getTime() : 0
        bVal = b.last_invoice_date ? new Date(b.last_invoice_date).getTime() : 0
      } else {
        return 0
      }

      if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
      return 0
    })
  }

  return results
})

function toggleSort(field: SortField) {
  if (sortField.value === field) {
    // Same field - cycle through: asc -> desc -> null
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else if (sortDirection.value === 'desc') {
      sortField.value = null
      sortDirection.value = null
    }
  } else {
    // New field - start with asc
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

const totalPages = computed(() => {
  return Math.ceil(filteredResults.value.length / pageSize)
})

const pagedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredResults.value.slice(start, end)
})

// Methods
async function loadClients() {
  try {
    await clientStore.fetchAllClients()
  } catch (error) {
    toast.error('Failed to load clients')
    console.error('Load clients error:', error)
  }
}

function onSearchInput() {
  // Reset to first page on new search
  currentPage.value = 1
}

function navigateToClient(clientId: string) {
  router.push({ name: 'client-detail', params: { id: clientId } })
}

function openCreateModal() {
  isCreateModalOpen.value = true
}

async function handleClientCreated(client: { id?: string }) {
  isCreateModalOpen.value = false
  toast.success('Client created successfully')

  // Reload clients to include the new one
  await loadClients()

  // Optionally navigate to the new client
  if (client?.id) {
    router.push({ name: 'client-detail', params: { id: client.id } })
  }
}

// Watch for page changes to scroll to top
watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

// Load all clients on mount
onMounted(() => {
  loadClients()
})
</script>
