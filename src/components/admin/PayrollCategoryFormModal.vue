<template>
  <Dialog :open="true" @update:open="handleClose">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{{
          isEditing ? 'Edit Payroll Category' : 'Create Payroll Category'
        }}</DialogTitle>
        <DialogDescription>
          {{
            isEditing
              ? 'Update the details for this payroll category.'
              : 'Add a new payroll category for timesheet entries.'
          }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="onSubmit" class="grid gap-4 py-4">
        <!-- Name (internal identifier) -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="name" class="text-right">Name</Label>
          <div class="col-span-3">
            <Input
              id="name"
              v-model="name"
              placeholder="e.g., annual_leave, work_ordinary"
              :disabled="isEditing"
            />
            <p class="text-xs text-gray-500 mt-1">
              Internal identifier (cannot change after creation)
            </p>
            <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
          </div>
        </div>

        <!-- Display Name -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="display_name" class="text-right">Display Name</Label>
          <div class="col-span-3">
            <Input
              id="display_name"
              v-model="display_name"
              placeholder="e.g., Annual Leave, Ordinary Time"
            />
            <p v-if="errors.display_name" class="text-red-500 text-sm mt-1">
              {{ errors.display_name }}
            </p>
          </div>
        </div>

        <!-- Job Name Pattern (for leave categories) -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="job_name_pattern" class="text-right">Job Pattern</Label>
          <div class="col-span-3">
            <Input
              id="job_name_pattern"
              :model-value="job_name_pattern ?? ''"
              @update:model-value="job_name_pattern = ($event as string) || null"
              placeholder="e.g., annual leave (case-insensitive)"
            />
            <p class="text-xs text-gray-500 mt-1">
              Substring to match in job name. Leave blank for work rate categories.
            </p>
          </div>
        </div>

        <!-- Rate Multiplier (for work categories) -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="rate_multiplier" class="text-right">Rate Multiplier</Label>
          <div class="col-span-3">
            <Input
              id="rate_multiplier"
              type="number"
              step="0.1"
              :model-value="rate_multiplier ?? undefined"
              @update:model-value="rate_multiplier = $event ? Number($event) : null"
              placeholder="e.g., 1.0, 1.5, 2.0"
            />
            <p class="text-xs text-gray-500 mt-1">
              For work entries (1.0 = ordinary, 1.5 = time-and-half, 2.0 = double). Leave blank for
              leave categories.
            </p>
          </div>
        </div>

        <!-- Posts to Xero -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="posts_to_xero" class="text-right">Posts to Xero</Label>
          <div class="col-span-3 flex items-center">
            <Switch
              id="posts_to_xero"
              :checked="posts_to_xero"
              @update:checked="posts_to_xero = $event"
            />
            <span class="ml-2 text-sm text-gray-600">Send entries to Xero Payroll</span>
          </div>
        </div>

        <!-- Uses Leave API (only shown if posts_to_xero) -->
        <div v-if="posts_to_xero" class="grid grid-cols-4 items-center gap-4">
          <Label for="uses_leave_api" class="text-right">Leave API</Label>
          <div class="col-span-3 flex items-center">
            <Switch
              id="uses_leave_api"
              :checked="uses_leave_api"
              @update:checked="uses_leave_api = $event"
            />
            <span class="ml-2 text-sm text-gray-600">
              {{
                uses_leave_api
                  ? 'Uses Xero Leave API (for leave with balances)'
                  : 'Uses Xero Timesheets API'
              }}
            </span>
          </div>
        </div>

        <!-- Xero Leave Type ID (only shown if uses_leave_api) -->
        <div v-if="posts_to_xero && uses_leave_api" class="grid grid-cols-4 items-center gap-4">
          <Label for="xero_leave_type_name" class="text-right">Leave Type Name</Label>
          <div class="col-span-3">
            <Input
              id="xero_leave_type_name"
              :model-value="xero_leave_type_name ?? ''"
              @update:model-value="xero_leave_type_name = ($event as string) || null"
              placeholder="e.g., Annual Leave"
            />
            <p class="text-xs text-gray-500 mt-1">Xero Leave Type name (looked up at runtime)</p>
            <p v-if="errors.xero_leave_type_name" class="text-red-500 text-sm mt-1">
              {{ errors.xero_leave_type_name }}
            </p>
          </div>
        </div>

        <!-- Xero Earnings Rate Name (only shown if NOT uses_leave_api but posts_to_xero) -->
        <div v-if="posts_to_xero && !uses_leave_api" class="grid grid-cols-4 items-center gap-4">
          <Label for="xero_earnings_rate_name" class="text-right">Earnings Rate</Label>
          <div class="col-span-3">
            <Input
              id="xero_earnings_rate_name"
              :model-value="xero_earnings_rate_name ?? ''"
              @update:model-value="xero_earnings_rate_name = ($event as string) || null"
              placeholder="e.g., Ordinary Hours"
            />
            <p class="text-xs text-gray-500 mt-1">Xero Earnings Rate name (looked up at runtime)</p>
            <p v-if="errors.xero_earnings_rate_name" class="text-red-500 text-sm mt-1">
              {{ errors.xero_earnings_rate_name }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">Cancel</Button>
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Saving...' : 'Save' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { PayrollCategory } from '@/services/payrollCategoryService'

const props = defineProps<{
  category: PayrollCategory | null
}>()

const emit = defineEmits(['close', 'save'])

const isEditing = computed(() => !!props.category)

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Name is required'),
    display_name: z.string().min(1, 'Display name is required'),
    job_name_pattern: z.string().nullable().optional(),
    rate_multiplier: z.number().nullable().optional(),
    posts_to_xero: z.boolean().default(false),
    uses_leave_api: z.boolean().default(false),
    xero_leave_type_name: z.string().nullable().optional(),
    xero_earnings_rate_name: z.string().nullable().optional(),
  }),
)

const { handleSubmit, defineField, errors, isSubmitting } = useForm({
  validationSchema: formSchema,
  initialValues: {
    name: props.category?.name ?? '',
    display_name: props.category?.display_name ?? '',
    job_name_pattern: props.category?.job_name_pattern ?? null,
    rate_multiplier: props.category?.rate_multiplier ?? null,
    posts_to_xero: props.category?.posts_to_xero ?? false,
    uses_leave_api: props.category?.uses_leave_api ?? false,
    xero_leave_type_name: props.category?.xero_leave_type_name ?? null,
    xero_earnings_rate_name: props.category?.xero_earnings_rate_name ?? null,
  },
})

const [name] = defineField('name')
const [display_name] = defineField('display_name')
const [job_name_pattern] = defineField('job_name_pattern')
const [rate_multiplier] = defineField('rate_multiplier')
const [posts_to_xero] = defineField('posts_to_xero')
const [uses_leave_api] = defineField('uses_leave_api')
const [xero_leave_type_name] = defineField('xero_leave_type_name')
const [xero_earnings_rate_name] = defineField('xero_earnings_rate_name')

const onSubmit = handleSubmit((values) => {
  // Clean up null/empty values
  const dataToSave = {
    ...values,
    job_name_pattern: values.job_name_pattern || null,
    rate_multiplier: values.rate_multiplier || null,
    xero_leave_type_name: values.xero_leave_type_name || null,
    xero_earnings_rate_name: values.xero_earnings_rate_name || null,
  }

  emit('save', dataToSave)
})

const handleClose = () => {
  emit('close')
}
</script>
