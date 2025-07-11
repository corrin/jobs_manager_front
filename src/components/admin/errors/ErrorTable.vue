<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'

/**

 * @deprecated Use generated types from src/api/generated instead

 * This interface will be removed after migration to openapi-zod-client generated types

 */

interface ErrorRecord {
  id: string
  timestamp: string
  message: string
  entity?: string
  severity?: string
}

const props = defineProps<{
  errors: ErrorRecord[]
  loading: boolean
  page: number
  pageCount: number
}>()
const emit = defineEmits(['rowClick', 'update:page'])

function onRowClick(record: ErrorRecord) {
  emit('rowClick', record)
}
</script>

<template>
  <div class="border rounded-md overflow-hidden">
    <div class="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Severity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="props.loading">
            <TableCell colspan="4" class="text-center py-6">Loading…</TableCell>
          </TableRow>
          <TableRow
            v-for="err in props.errors"
            :key="err.id"
            class="cursor-pointer hover:bg-accent"
            @click="onRowClick(err)"
          >
            <TableCell>{{ new Date(err.timestamp).toLocaleString() }}</TableCell>
            <TableCell>{{ err.message }}</TableCell>
            <TableCell>{{ err.entity || '-' }}</TableCell>
            <TableCell>{{ err.severity || 'error' }}</TableCell>
          </TableRow>
          <TableRow v-if="!props.loading && props.errors.length === 0">
            <TableCell colspan="4" class="text-center py-6">No errors found.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <Pagination
      class="mt-2"
      :page="props.page"
      :total="props.pageCount"
      @update:page="emit('update:page', $event)"
    />
  </div>
</template>
