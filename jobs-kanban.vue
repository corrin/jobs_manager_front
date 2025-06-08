<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-8">
          <h1 class="text-xl font-bold text-gray-900">Jobs Manager</h1>
          <div class="flex items-center space-x-6">
            <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Create Job</a>
            <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Timesheets</a>
            
            <!-- Purchases Dropdown -->
            <div class="relative" @click.stop>
              <button @click="toggleDropdown('purchases')" class="text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                Purchases
                <ChevronDown class="ml-1 h-4 w-4" />
              </button>
              <div v-if="activeDropdown === 'purchases'" class="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Purchase Orders</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Delivery Receipts</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Use Stock</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Upload Supplier Pricing</a>
              </div>
            </div>
            
            <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Xero</a>
            
            <!-- Reports Dropdown -->
            <div class="relative" @click.stop>
              <button @click="toggleDropdown('reports')" class="text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                Reports
                <ChevronDown class="ml-1 h-4 w-4" />
              </button>
              <div v-if="activeDropdown === 'reports'" class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">KPI Reports</a>
              </div>
            </div>
            
            <!-- Admin Dropdown -->
            <div class="relative" @click.stop>
              <button @click="toggleDropdown('admin')" class="text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                Admin
                <ChevronDown class="ml-1 h-4 w-4" />
              </button>
              <div v-if="activeDropdown === 'admin'" class="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Run Month End</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit Staff</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit Company Defaults</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Archive Complete Jobs</a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <span class="text-gray-700">Welcome, {{ currentUser }}!</span>
          <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors">
            Log out
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="p-6">
      <!-- Search Section -->
      <div class="mb-6 space-y-4">
        <div class="flex items-center justify-between">
          <button 
            @click="showAdvancedSearch = !showAdvancedSearch"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-all duration-200 flex items-center"
          >
            <Search class="mr-2 h-4 w-4" />
            Advanced Search
            <ChevronDown :class="['ml-2 h-4 w-4 transition-transform', showAdvancedSearch ? 'rotate-180' : '']" />
          </button>
          
          <div class="flex-1 max-w-md ml-4">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                v-model="simpleSearch"
                type="text"
                placeholder="Search jobs..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                @input="handleSimpleSearch"
              />
            </div>
          </div>
        </div>

        <!-- Advanced Search Panel -->
        <div v-if="showAdvancedSearch" class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-all duration-300">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Job Number</label>
              <input v-model="advancedFilters.jobNumber" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Job Name</label>
              <input v-model="advancedFilters.jobName" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select v-model="advancedFilters.client" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Clients</option>
                <option v-for="client in clients" :key="client" :value="client">{{ client }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="advancedFilters.status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Status</option>
                <option v-for="status in kanbanColumns" :key="status" :value="status">{{ formatStatus(status) }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input v-model="advancedFilters.description" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input v-model="advancedFilters.contactPerson" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Created By</label>
              <select v-model="advancedFilters.createdBy" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Staff</option>
                <option v-for="staff in teamMembers" :key="staff.name" :value="staff.name">{{ staff.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select v-model="advancedFilters.paymentStatus" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Any</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
          <div class="flex space-x-3">
            <button @click="performAdvancedSearch" class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors">
              Search
            </button>
            <button @click="clearFilters" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Team Members -->
      <div v-if="!showSearchResults" class="mb-6">
        <div class="flex justify-center">
          <div class="flex space-x-3">
            <div v-for="member in teamMembers" :key="member.name" class="flex flex-col items-center">
              <div 
                :class="['w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm', member.color]"
                :title="member.name"
              >
                {{ member.initials }}
              </div>
              <span class="text-xs text-gray-600 mt-1">{{ member.name.split(' ')[0] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Results Grid -->
      <div v-if="showSearchResults" class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Search Results ({{ searchResults.length }} jobs found)</h2>
          <button @click="backToKanban" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Back to Kanban
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div v-for="job in searchResults" :key="job.id" class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-medium text-blue-600">#{{ job.jobNumber }}</span>
              <span :class="['px-2 py-1 rounded-full text-xs font-medium', getStatusColor(job.status)]">
                {{ formatStatus(job.status) }}
              </span>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">{{ job.title }}</h3>
            <p class="text-sm text-gray-600 mb-2">{{ job.description }}</p>
            <div class="text-xs text-gray-500">
              <p>Client: {{ job.client }}</p>
              <p>Contact: {{ job.contactPerson }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Kanban Board -->
      <div v-if="!showSearchResults" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <div v-for="column in kanbanColumns" :key="column" class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-4 border-b border-gray-200">
              <h3 class="font-semibold text-gray-900 text-sm">{{ formatStatus(column) }}</h3>
              <span class="text-xs text-gray-500">{{ getJobsByStatus(column).length }} jobs</span>
            </div>
            <div class="p-3 space-y-3 min-h-[400px]">
              <div 
                v-for="job in getJobsByStatus(column)" 
                :key="job.id"
                class="bg-gray-50 p-3 rounded-md border border-gray-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
                @click="selectJob(job)"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="text-xs font-medium text-blue-600">#{{ job.jobNumber }}</span>
                  <span :class="['w-2 h-2 rounded-full', job.paymentStatus === 'paid' ? 'bg-green-400' : 'bg-red-400']"></span>
                </div>
                <h4 class="font-medium text-gray-900 text-sm mb-1">{{ job.title }}</h4>
                <p class="text-xs text-gray-600 mb-2">{{ job.description }}</p>
                <div class="text-xs text-gray-500">
                  <p>{{ job.client }}</p>
                  <p>{{ job.contactPerson }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Archived Section -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <button 
            @click="showArchived = !showArchived"
            class="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center">
              <Archive class="mr-2 h-4 w-4 text-gray-500" />
              <span class="font-semibold text-gray-900">Archived Jobs</span>
              <span class="ml-2 text-sm text-gray-500">({{ archivedJobs.length }})</span>
            </div>
            <ChevronDown :class="['h-4 w-4 text-gray-500 transition-transform', showArchived ? 'rotate-180' : '']" />
          </button>
          
          <div v-if="showArchived" class="border-t border-gray-200 p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <div 
                v-for="job in archivedJobs" 
                :key="job.id"
                class="bg-gray-50 p-3 rounded-md border border-gray-200 opacity-75"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="text-xs font-medium text-gray-500">#{{ job.jobNumber }}</span>
                  <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Archived</span>
                </div>
                <h4 class="font-medium text-gray-700 text-sm mb-1">{{ job.title }}</h4>
                <p class="text-xs text-gray-500 mb-2">{{ job.description }}</p>
                <div class="text-xs text-gray-400">
                  <p>{{ job.client }}</p>
                  <p>{{ job.contactPerson }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, ChevronDown, Archive, ArrowLeft } from 'lucide-vue-next'

// Reactive data
const currentUser = ref('John Doe')
const activeDropdown = ref(null)
const showAdvancedSearch = ref(false)
const showSearchResults = ref(false)
const showArchived = ref(false)
const simpleSearch = ref('')
const searchResults = ref([])

const advancedFilters = ref({
  jobNumber: '',
  jobName: '',
  description: '',
  client: '',
  contactPerson: '',
  createdBy: '',
  status: '',
  paymentStatus: ''
})

// Static data
const kanbanColumns = [
  'quoting',
  'accepted-quote',
  'awaiting-materials',
  'in-progress',
  'on-hold',
  'special',
  'completed',
  'rejected'
]

const clients = [
  'ABC Corporation',
  'XYZ Industries',
  'Tech Solutions Ltd',
  'Global Manufacturing',
  'Creative Agency Co'
]

const teamMembers = [
  { name: 'John Doe', initials: 'JD', color: 'bg-blue-500' },
  { name: 'Jane Smith', initials: 'JS', color: 'bg-green-500' },
  { name: 'Mike Johnson', initials: 'MJ', color: 'bg-purple-500' },
  { name: 'Sarah Wilson', initials: 'SW', color: 'bg-pink-500' },
  { name: 'David Brown', initials: 'DB', color: 'bg-indigo-500' },
  { name: 'Lisa Garcia', initials: 'LG', color: 'bg-yellow-500' },
  { name: 'Tom Anderson', initials: 'TA', color: 'bg-red-500' },
  { name: 'Emma Davis', initials: 'ED', color: 'bg-teal-500' }
]

const jobs = ref([
  {
    id: 1,
    jobNumber: '2024-001',
    title: 'Website Redesign',
    description: 'Complete website overhaul for client',
    client: 'ABC Corporation',
    contactPerson: 'John Smith',
    status: 'quoting',
    paymentStatus: 'unpaid',
    createdBy: 'John Doe'
  },
  {
    id: 2,
    jobNumber: '2024-002',
    title: 'Mobile App Development',
    description: 'iOS and Android app development',
    client: 'XYZ Industries',
    contactPerson: 'Mary Johnson',
    status: 'accepted-quote',
    paymentStatus: 'paid',
    createdBy: 'Jane Smith'
  },
  {
    id: 3,
    jobNumber: '2024-003',
    title: 'Database Migration',
    description: 'Migrate legacy database to cloud',
    client: 'Tech Solutions Ltd',
    contactPerson: 'Robert Davis',
    status: 'awaiting-materials',
    paymentStatus: 'unpaid',
    createdBy: 'Mike Johnson'
  },
  {
    id: 4,
    jobNumber: '2024-004',
    title: 'E-commerce Platform',
    description: 'Build custom e-commerce solution',
    client: 'Global Manufacturing',
    contactPerson: 'Lisa Brown',
    status: 'in-progress',
    paymentStatus: 'paid',
    createdBy: 'Sarah Wilson'
  },
  {
    id: 5,
    jobNumber: '2024-005',
    title: 'Brand Identity Design',
    description: 'Complete brand redesign package',
    client: 'Creative Agency Co',
    contactPerson: 'Mark Wilson',
    status: 'on-hold',
    paymentStatus: 'unpaid',
    createdBy: 'David Brown'
  },
  {
    id: 6,
    jobNumber: '2024-006',
    title: 'API Integration',
    description: 'Third-party API integration project',
    client: 'ABC Corporation',
    contactPerson: 'John Smith',
    status: 'special',
    paymentStatus: 'paid',
    createdBy: 'Lisa Garcia'
  },
  {
    id: 7,
    jobNumber: '2024-007',
    title: 'Security Audit',
    description: 'Complete security assessment',
    client: 'XYZ Industries',
    contactPerson: 'Mary Johnson',
    status: 'completed',
    paymentStatus: 'paid',
    createdBy: 'Tom Anderson'
  },
  {
    id: 8,
    jobNumber: '2024-008',
    title: 'Server Setup',
    description: 'New server infrastructure setup',
    client: 'Tech Solutions Ltd',
    contactPerson: 'Robert Davis',
    status: 'rejected',
    paymentStatus: 'unpaid',
    createdBy: 'Emma Davis'
  }
])

const archivedJobs = ref([
  {
    id: 101,
    jobNumber: '2023-045',
    title: 'Legacy System Update',
    description: 'Updated old legacy system',
    client: 'ABC Corporation',
    contactPerson: 'John Smith',
    status: 'archived',
    paymentStatus: 'paid',
    createdBy: 'John Doe'
  },
  {
    id: 102,
    jobNumber: '2023-046',
    title: 'Data Analysis Project',
    description: 'Comprehensive data analysis',
    client: 'Global Manufacturing',
    contactPerson: 'Lisa Brown',
    status: 'archived',
    paymentStatus: 'paid',
    createdBy: 'Jane Smith'
  }
])

// Methods
const toggleDropdown = (dropdown) => {
  activeDropdown.value = activeDropdown.value === dropdown ? null : dropdown
}

const closeDropdowns = () => {
  activeDropdown.value = null
}

const formatStatus = (status) => {
  return status.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const getStatusColor = (status) => {
  const colors = {
    'quoting': 'bg-yellow-100 text-yellow-800',
    'accepted-quote': 'bg-green-100 text-green-800',
    'awaiting-materials': 'bg-orange-100 text-orange-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'on-hold': 'bg-red-100 text-red-800',
    'special': 'bg-purple-100 text-purple-800',
    'completed': 'bg-green-100 text-green-800',
    'rejected': 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getJobsByStatus = (status) => {
  return jobs.value.filter(job => job.status === status)
}

const handleSimpleSearch = () => {
  if (simpleSearch.value.trim()) {
    const filtered = jobs.value.filter(job => 
      job.title.toLowerCase().includes(simpleSearch.value.toLowerCase()) ||
      job.description.toLowerCase().includes(simpleSearch.value.toLowerCase()) ||
      job.client.toLowerCase().includes(simpleSearch.value.toLowerCase()) ||
      job.contactPerson.toLowerCase().includes(simpleSearch.value.toLowerCase()) ||
      job.jobNumber.toLowerCase().includes(simpleSearch.value.toLowerCase())
    )
    searchResults.value = filtered
    showSearchResults.value = true
  } else {
    showSearchResults.value = false
  }
}

const performAdvancedSearch = () => {
  let filtered = jobs.value

  if (advancedFilters.value.jobNumber) {
    filtered = filtered.filter(job => 
      job.jobNumber.toLowerCase().includes(advancedFilters.value.jobNumber.toLowerCase())
    )
  }
  
  if (advancedFilters.value.jobName) {
    filtered = filtered.filter(job => 
      job.title.toLowerCase().includes(advancedFilters.value.jobName.toLowerCase())
    )
  }
  
  if (advancedFilters.value.description) {
    filtered = filtered.filter(job => 
      job.description.toLowerCase().includes(advancedFilters.value.description.toLowerCase())
    )
  }
  
  if (advancedFilters.value.client) {
    filtered = filtered.filter(job => job.client === advancedFilters.value.client)
  }
  
  if (advancedFilters.value.contactPerson) {
    filtered = filtered.filter(job => 
      job.contactPerson.toLowerCase().includes(advancedFilters.value.contactPerson.toLowerCase())
    )
  }
  
  if (advancedFilters.value.createdBy) {
    filtered = filtered.filter(job => job.createdBy === advancedFilters.value.createdBy)
  }
  
  if (advancedFilters.value.status) {
    filtered = filtered.filter(job => job.status === advancedFilters.value.status)
  }
  
  if (advancedFilters.value.paymentStatus) {
    filtered = filtered.filter(job => job.paymentStatus === advancedFilters.value.paymentStatus)
  }

  searchResults.value = filtered
  showSearchResults.value = true
}

const clearFilters = () => {
  advancedFilters.value = {
    jobNumber: '',
    jobName: '',
    description: '',
    client: '',
    contactPerson: '',
    createdBy: '',
    status: '',
    paymentStatus: ''
  }
  simpleSearch.value = ''
  showSearchResults.value = false
}

const backToKanban = () => {
  showSearchResults.value = false
  simpleSearch.value = ''
}

const selectJob = (job) => {
  console.log('Selected job:', job)
  // Here you would typically open a job details modal or navigate to job details page
}

// Event listeners
onMounted(() => {
  document.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
})
</script>

<style scoped>
/* Custom animations and transitions are handled by Tailwind classes */
</style>