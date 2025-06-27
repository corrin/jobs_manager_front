import { h } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'

export const jobColumns = [
  {
    id: 'select',
    header: ({ table }) =>
      h(Checkbox, {
        modelValue: table.options.meta?.allRowsSelected,
        indeterminate: table.options.meta?.someRowsSelected && !table.options.meta?.allRowsSelected,
        'onUpdate:modelValue': (val: boolean) => table.options.meta?.toggleAllRows?.(val),
      }),
    cell: ({ row, table }) =>
      h(Checkbox, {
        modelValue: table.options.meta?.selectedIds?.includes(row.original.id),
        'onUpdate:modelValue': (val: boolean) =>
          table.options.meta?.toggleRow?.(row.original.id, val),
      }),
    size: 48,
    enableSorting: false,
    enableResizing: false,
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Job',
    cell: ({ row }) => h('span', row.original.name),
  },
  {
    id: 'client_name',
    accessorKey: 'client_name',
    header: 'Client',
    cell: ({ row }) => h('span', row.original.client_name),
  },
  {
    id: 'updated_at',
    accessorKey: 'updated_at',
    header: 'Last Update',
    cell: ({ row }) => {
      const date = row.original.updated_at
      if (!date) return h('span', '-')
      const d = new Date(date)
      const formatted =
        d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      return h('span', formatted)
    },
  },
]
