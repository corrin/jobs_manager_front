<template>
  <AppLayout>
    <div class="p-4 sm:p-8">
      <h1 class="text-2xl font-bold mb-6">Payroll Categories</h1>

      <div class="mb-4 flex justify-end">
        <Button @click="openCreateModal">
          <Plus class="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div v-if="isLoading" class="text-center py-10">
        <div class="flex items-center justify-center gap-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          Loading payroll categories...
        </div>
      </div>
      <div
        v-else-if="error"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ error }}</span>
      </div>

      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Job Pattern</TableHead>
              <TableHead class="text-center">Posts to Xero</TableHead>
              <TableHead>Xero Config</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="categories.length > 0">
              <TableRow v-for="category in categories" :key="category.id">
                <TableCell class="font-medium">{{ category.display_name }}</TableCell>
                <TableCell class="font-mono text-sm text-gray-500">{{ category.name }}</TableCell>
                <TableCell>
                  <span v-if="category.rate_multiplier" class="font-mono">
                    {{ category.rate_multiplier }}x
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </TableCell>
                <TableCell>
                  <span v-if="category.job_name_pattern" class="text-sm">
                    "{{ category.job_name_pattern }}"
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </TableCell>
                <TableCell class="text-center">
                  <Badge v-if="category.posts_to_xero" variant="default">Yes</Badge>
                  <Badge v-else variant="secondary">No</Badge>
                </TableCell>
                <TableCell>
                  <span v-if="category.posts_to_xero" class="text-sm">
                    <template v-if="category.uses_leave_api">
                      Leave: {{ category.xero_leave_type_name || '-' }}
                    </template>
                    <template v-else>
                      Rate: {{ category.xero_earnings_rate_name || '-' }}
                    </template>
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" @click="openEditModal(category)"
                      >Edit</Button
                    >
                    <Button variant="destructive" size="sm" @click="confirmDelete(category)"
                      >Delete</Button
                    >
                  </div>
                </TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow>
                <TableCell colspan="7" class="text-center py-10 text-gray-500">
                  No payroll categories configured yet.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- Modals -->
    <PayrollCategoryFormModal
      v-if="isModalOpen"
      :category="selectedCategory"
      @close="closeModal"
      @save="handleSave"
    />

    <ConfirmModal
      v-if="isConfirmOpen"
      title="Confirm Deletion"
      :message="`Are you sure you want to delete '${categoryToDelete?.display_name}'? This action cannot be undone.`"
      @confirm="deleteCategory"
      @close="isConfirmOpen = false"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import PayrollCategoryFormModal from '@/components/admin/PayrollCategoryFormModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import {
  PayrollCategoryService,
  type PayrollCategory,
  type PayrollCategoryCreateUpdate,
} from '@/services/payrollCategoryService'

const payrollCategoryService = PayrollCategoryService.getInstance()

const categories = ref<PayrollCategory[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const isModalOpen = ref(false)
const selectedCategory = ref<PayrollCategory | null>(null)

const isConfirmOpen = ref(false)
const categoryToDelete = ref<PayrollCategory | null>(null)

const fetchCategories = async () => {
  isLoading.value = true
  error.value = null
  try {
    categories.value = await payrollCategoryService.getCategories()
  } catch {
    const message = 'Failed to load payroll categories. Please check the network connection.'
    error.value = message
    toast.error(message)
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  selectedCategory.value = null
  isModalOpen.value = true
}

const openEditModal = (category: PayrollCategory) => {
  selectedCategory.value = { ...category }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedCategory.value = null
}

const handleSave = async (categoryData: PayrollCategoryCreateUpdate & { name: string }) => {
  try {
    if (selectedCategory.value?.id) {
      await payrollCategoryService.updateCategory(selectedCategory.value.id, categoryData)
      toast.success('Category updated successfully.')
    } else {
      await payrollCategoryService.createCategory(categoryData)
      toast.success('Category created successfully.')
    }
    closeModal()
    await fetchCategories()
  } catch (err: unknown) {
    const errMessage = (err as Error).message || 'An unknown error occurred.'
    toast.error('Failed to save category.', { description: errMessage })
  }
}

const confirmDelete = (category: PayrollCategory) => {
  categoryToDelete.value = category
  isConfirmOpen.value = true
}

const deleteCategory = async () => {
  if (!categoryToDelete.value) return
  try {
    await payrollCategoryService.deleteCategory(categoryToDelete.value.id)
    toast.success('Category deleted successfully.')
    await fetchCategories()
  } catch (err: unknown) {
    const errMessage = (err as Error).message || 'An unknown error occurred.'
    toast.error('Failed to delete category.', { description: errMessage })
  } finally {
    isConfirmOpen.value = false
    categoryToDelete.value = null
  }
}

onMounted(() => {
  fetchCategories()
})
</script>
