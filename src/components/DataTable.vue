<script setup lang="ts" generic="TData">
import { getCoreRowModel, useVueTable, FlexRender, type ColumnDef } from '@tanstack/vue-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { computed } from 'vue'

const props = defineProps<{
  columns: ColumnDef<TData>[]
  data: TData[]
}>()

const emit = defineEmits<{ add: [] }>()

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  getCoreRowModel: getCoreRowModel(),
})

const colCount = computed(() => props.columns.length)
</script>
<template>
  <div class="space-y-2">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="table.getRowModel().rows.length">
          <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="colCount" class="h-24 text-center">No results.</TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
    <div class="px-2">
      <Button variant="secondary" class="w-full" @click="emit('add')">＋ Add line</Button>
    </div>
  </div>
</template>
