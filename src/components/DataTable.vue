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
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { computed } from 'vue'

const props = defineProps<{
  columns: ColumnDef<TData>[]
  data: TData[]
  pageSize?: number
}>()

const emit = defineEmits<{ add: []; rowClick: [TData] }>()

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
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="hover:bg-slate-50 cursor-pointer"
            @click="emit('rowClick', row.original)"
          >
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <template v-if="cell.column.columnDef.meta?.editable === false">
                {{ cell.getValue() }}
              </template>
              <template v-else-if="typeof cell.getValue() === 'boolean'">
                <Checkbox
                  :model-value="(row.original as any)[cell.column.id]"
                  @update:model-value="(v) => ((row.original as any)[cell.column.id] = v)"
                />
              </template>
              <template v-else>
                <Input
                  :model-value="(row.original as any)[cell.column.id]"
                  @update:model-value="(v) => ((row.original as any)[cell.column.id] = v)"
                />
              </template>
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
