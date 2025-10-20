<script setup lang="ts">
import { computed } from 'vue'
import { useVModel } from '@vueuse/core'
import Input from '@/components/ui/input/Input.vue'
import { Button } from '@/components/ui/button'
import Label from '@/components/ui/label/Label.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SystemErrorFilterState } from '@/types/errorFilters'

const defaultState: SystemErrorFilterState = {
  app: '',
  severity: '',
  resolved: 'all',
  jobId: '',
  userId: '',
}

const props = defineProps<{ modelValue: SystemErrorFilterState }>()
const emit = defineEmits<{ 'update:modelValue': [SystemErrorFilterState] }>()

const model = useVModel(props, 'modelValue', emit)

const appFilter = computed({
  get: () => model.value.app,
  set: (value: string) => {
    model.value = { ...model.value, app: value }
  },
})

const severityFilter = computed({
  get: () => model.value.severity,
  set: (value: string) => {
    model.value = { ...model.value, severity: value }
  },
})

const resolvedFilter = computed<'all' | 'true' | 'false'>({
  get: () => model.value.resolved,
  set: (value) => {
    model.value = { ...model.value, resolved: value }
  },
})

const jobFilter = computed({
  get: () => model.value.jobId,
  set: (value: string) => {
    model.value = { ...model.value, jobId: value }
  },
})

const userFilter = computed({
  get: () => model.value.userId,
  set: (value: string) => {
    model.value = { ...model.value, userId: value }
  },
})

const hasActiveFilters = computed(() => {
  const value = model.value
  return (
    !!value.app.trim() ||
    !!value.severity.trim() ||
    value.resolved !== 'all' ||
    !!value.jobId.trim() ||
    !!value.userId.trim()
  )
})

function resetFilters() {
  model.value = { ...defaultState }
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] items-end">
    <div class="flex flex-col gap-2">
      <Label for="system-error-app">Search</Label>
      <Input
        id="system-error-app"
        v-model="appFilter"
        placeholder="App contains..."
        autocomplete="off"
      />
    </div>
    <div class="flex flex-col gap-2">
      <Label for="system-error-severity">Severity</Label>
      <Input
        id="system-error-severity"
        v-model="severityFilter"
        type="number"
        min="0"
        step="1"
        placeholder="Any"
      />
    </div>
    <div class="flex flex-col gap-2">
      <Label for="system-error-resolved">Resolved</Label>
      <Select v-model="resolvedFilter">
        <SelectTrigger id="system-error-resolved">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="true">Resolved</SelectItem>
          <SelectItem value="false">Unresolved</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="flex flex-col gap-2">
      <Label for="system-error-job">Job ID</Label>
      <Input id="system-error-job" v-model="jobFilter" placeholder="Job UUID" autocomplete="off" />
    </div>
    <div class="flex flex-col gap-2">
      <Label for="system-error-user">User ID</Label>
      <Input
        id="system-error-user"
        v-model="userFilter"
        placeholder="User UUID"
        autocomplete="off"
      />
    </div>
    <div class="flex items-end">
      <Button
        variant="outline"
        class="w-full md:w-auto"
        :disabled="!hasActiveFilters"
        @click="resetFilters"
      >
        Clear
      </Button>
    </div>
  </div>
</template>
