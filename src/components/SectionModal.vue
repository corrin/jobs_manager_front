<template>
  <Dialog :open="true" @update:open="emit('close')">
    <DialogContent class="max-w-md animate-in fade-in-0 zoom-in-95">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <component :is="sectionIcon" class="w-6 h-6" />
          {{ sectionTitle }}
        </DialogTitle>
        <DialogDescription> Edit company defaults for {{ sectionTitle }} </DialogDescription>
      </DialogHeader>
      <form @submit.prevent class="flex flex-col gap-4 mt-2">
        <template v-if="props.section === 'working_hours'">
          <div v-for="day in workingDays" :key="day.key" class="working-hours-day-wrapper">
            <div class="working-hours-day-label">
              <component :is="Clock" class="w-4 h-4 text-indigo-400 mr-1" />
              <span class="font-semibold">{{ day.label }}</span>
            </div>
            <div class="flex gap-2 items-center mt-1">
              <label class="flex items-center gap-1 text-xs font-medium">
                Start
                <Input
                  v-model="localForm[day.startKey] as string"
                  type="text"
                  class="h-8 w-40 text-xs"
                  placeholder="08:00"
                />
              </label>
              <span class="text-gray-400">-</span>
              <label class="flex items-center gap-1 text-xs font-medium">
                End
                <Input
                  v-model="localForm[day.endKey] as string"
                  type="text"
                  class="h-8 w-40 text-xs"
                  placeholder="17:00"
                />
              </label>
            </div>
          </div>
        </template>
        <template v-else>
          <template v-for="field in sectionFields" :key="field.key">
            <label class="flex items-center gap-2 text-sm font-medium">
              <component :is="field.icon" class="w-4 h-4 text-indigo-400" />
              <span class="w-36">{{ field.label }}</span>
              <Input
                v-if="field.type === 'text' || field.type === 'number'"
                v-model="localForm[field.key] as string | number | undefined"
                :type="field.type"
                class="flex-1 h-8 text-xs"
                :step="
                  field.key === 'time_markup' || field.key === 'materials_markup'
                    ? 'any'
                    : undefined
                "
                :min="
                  field.key === 'time_markup' || field.key === 'materials_markup' ? 0 : undefined
                "
                :max="
                  field.key === 'time_markup' || field.key === 'materials_markup' ? 1 : undefined
                "
              />
              <Checkbox
                v-else-if="field.type === 'boolean'"
                v-model="localForm[field.key] as boolean | null | undefined"
              />
              <div v-else-if="field.type === 'date'" class="flex-1 relative">
                <Input
                  :modelValue="formatDateTime(localForm[field.key] as string | Date | null)"
                  type="text"
                  class="h-8 text-xs cursor-pointer bg-white"
                  readonly
                  @focus="openCalendar(field.key)"
                  @click="openCalendar(field.key)"
                />
                <transition name="fade">
                  <div
                    v-if="calendarField === field.key"
                    class="absolute z-50 left-0 bottom-10 w-max min-w-[260px] bg-white border border-gray-200 rounded-lg shadow-lg p-4"
                    @click.stop
                  >
                    <Calendar
                      :modelValue="
                        (getValidDate(localForm[field.key] as string | Date | null) ||
                          getValidDate(props.form[field.key] as string | Date | null)) as any
                      "
                      @update:modelValue="
                        (date) => onCalendarSelect(field.key, date as CalendarDateTime | null)
                      "
                    />
                    <div class="flex justify-end mt-2">
                      <Button size="sm" variant="outline" @click="closeCalendar">Close</Button>
                    </div>
                  </div>
                </transition>
              </div>
            </label>
          </template>
        </template>
        <p v-if="error" class="text-red-600 text-xs mt-1">{{ error }}</p>
        <div class="flex justify-end gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            @click="emit('close')"
            class="flex items-center gap-1"
          >
            <ArrowLeft class="w-4 h-4" /> Close
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
import Calendar from '@/components/ui/calendar/Calendar.vue'
import {
  Settings,
  FileText,
  Link2,
  BarChart3,
  Sparkles,
  Calendar as CalendarIcon,
  DollarSign,
  Hash,
  User,
  File,
  Key,
  ArrowLeft,
  Clock,
  Percent,
  TrendingUp,
  Folder,
} from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'
import { CalendarDateTime, parseDateTime } from '@internationalized/date'
import { debugLog } from '@/utils/debug'

type SectionKey = keyof typeof sectionMap
const props = defineProps<{ section: SectionKey; form: Record<string, unknown> }>()
const emit = defineEmits(['close', 'update'])
const localForm = ref({ ...props.form })

// Debug logging for type issues
debugLog('SectionModal props.section:', props.section, 'type:', typeof props.section)
debugLog('SectionModal props.form:', props.form)
debugLog('SectionModal localForm initial:', localForm.value)

watch(
  () => props.form,
  (newForm) => {
    localForm.value = { ...newForm }
  },
)

const calendarField = ref<string | null>(null)

function openCalendar(field: string) {
  calendarField.value = field
  if (!localForm.value[field]) {
    const now = new Date()
    localForm.value[field] = now.toISOString()
  }
}
function closeCalendar() {
  calendarField.value = null
}
function onCalendarSelect(field: string, date: CalendarDateTime | null) {
  if (date && typeof date === 'object' && 'year' in date) {
    const jsDate = new Date(
      date.year,
      date.month - 1,
      date.day,
      date.hour || 0,
      date.minute || 0,
      date.second || 0,
    )
    localForm.value[field] = jsDate.toISOString()
  } else {
    localForm.value[field] = null
  }
  closeCalendar()
}
function formatDateTime(val: string | Date | null) {
  if (!val) return ''
  let d: Date | null = null
  if (typeof val === 'string') {
    d = new Date(val)
    if (isNaN(d.getTime())) return ''
  } else if (val instanceof Date) {
    d = val
  } else if (
    typeof val === 'object' &&
    val !== null &&
    Object.prototype.hasOwnProperty.call(val, 'year')
  ) {
    const anyVal = val as {
      year: number
      month: number
      day: number
      hour?: number
      minute?: number
      second?: number
    }
    d = new Date(
      anyVal.year,
      anyVal.month - 1,
      anyVal.day,
      anyVal.hour || 0,
      anyVal.minute || 0,
      anyVal.second || 0,
    )
  }
  if (!d || isNaN(d.getTime())) return ''
  return (
    d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  )
}
function getValidDate(val: string | Date | null): CalendarDateTime | null {
  if (!val) return null
  if (val instanceof CalendarDateTime) return val
  if (typeof val === 'string') {
    try {
      return parseDateTime(val)
    } catch {
      const d = new Date(val)
      if (!isNaN(d.getTime())) return toCalendarDate(d)
      return null
    }
  }
  if (val instanceof Date && !isNaN(val.getTime())) return toCalendarDate(val)
  if (typeof val === 'object' && 'year' in val) return toCalendarDate(val)
  return null
}
function toCalendarDate(
  date:
    | Date
    | { year: number; month: number; day: number; hour?: number; minute?: number; second?: number },
): CalendarDateTime {
  if (date instanceof Date) {
    return new CalendarDateTime(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    )
  }
  return new CalendarDateTime(
    date.year,
    date.month,
    date.day,
    date.hour || 0,
    date.minute || 0,
    date.second || 0,
  )
}

const sectionMap = {
  general: {
    title: 'General',
    icon: Settings,
    fields: [
      { key: 'company_name', label: 'Company Name', icon: User, type: 'text' },
      { key: 'charge_out_rate', label: 'Charge Out Rate', icon: DollarSign, type: 'number' },
      { key: 'wage_rate', label: 'Wage Rate', icon: DollarSign, type: 'number' },
      { key: 'time_markup', label: 'Time Markup', icon: Percent, type: 'number' },
      { key: 'materials_markup', label: 'Materials Markup', icon: Percent, type: 'number' },
      { key: 'starting_job_number', label: 'Starting Job Number', icon: Hash, type: 'number' },
      { key: 'po_prefix', label: 'PO Prefix', icon: Hash, type: 'text' },
      { key: 'shop_client_name', label: 'Shop Client Name', icon: User, type: 'text' },
    ],
  },
  google: {
    title: 'Google Sheets',
    icon: FileText,
    fields: [
      {
        key: 'master_quote_template_url',
        label: 'Master Quote Template URL',
        icon: File,
        type: 'text',
      },
      {
        key: 'master_quote_template_id',
        label: 'Master Quote Template ID',
        icon: Key,
        type: 'text',
      },
      {
        key: 'gdrive_quotes_folder_url',
        label: 'GDrive Quotes Folder URL',
        icon: Folder,
        type: 'text',
      },
      { key: 'gdrive_quotes_folder_id', label: 'GDrive Quotes Folder ID', icon: Key, type: 'text' },
    ],
  },
  xero: {
    title: 'Xero Integration',
    icon: Link2,
    fields: [
      { key: 'xero_tenant_id', label: 'Xero Tenant ID', icon: Key, type: 'text' },
      { key: 'last_xero_sync', label: 'Last Xero Sync', icon: CalendarIcon, type: 'date' },
      { key: 'last_xero_deep_sync', label: 'Last Deep Sync', icon: CalendarIcon, type: 'date' },
    ],
  },
  kpi: {
    title: 'KPI & Thresholds',
    icon: BarChart3,
    fields: [
      {
        key: 'billable_threshold_green',
        label: 'Billable Green',
        icon: TrendingUp,
        type: 'number',
      },
      {
        key: 'billable_threshold_amber',
        label: 'Billable Amber',
        icon: TrendingUp,
        type: 'number',
      },
      { key: 'daily_gp_target', label: 'Daily GP Target', icon: DollarSign, type: 'number' },
      { key: 'shop_hours_target_percentage', label: 'Shop Hours %', icon: Percent, type: 'number' },
    ],
  },
  ai: {
    title: 'AI Providers',
    icon: Sparkles,
    fields: [],
  },
  working_hours: {
    title: 'Working Hours',
    icon: CalendarIcon,
    fields: [
      { key: 'mon_start', label: 'Monday Start', icon: Clock, type: 'text' },
      { key: 'mon_end', label: 'Monday End', icon: Clock, type: 'text' },
      { key: 'tue_start', label: 'Tuesday Start', icon: Clock, type: 'text' },
      { key: 'tue_end', label: 'Tuesday End', icon: Clock, type: 'text' },
      { key: 'wed_start', label: 'Wednesday Start', icon: Clock, type: 'text' },
      { key: 'wed_end', label: 'Wednesday End', icon: Clock, type: 'text' },
      { key: 'thu_start', label: 'Thursday Start', icon: Clock, type: 'text' },
      { key: 'thu_end', label: 'Thursday End', icon: Clock, type: 'text' },
      { key: 'fri_start', label: 'Friday Start', icon: Clock, type: 'text' },
      { key: 'fri_end', label: 'Friday End', icon: Clock, type: 'text' },
    ],
  },
}

const sectionTitle = computed(() => sectionMap[props.section]?.title || '')
const sectionIcon = computed(() => sectionMap[props.section]?.icon || Settings)
const sectionFields = computed(() => sectionMap[props.section]?.fields || [])
const error = ref('')

watch(
  localForm,
  (val) => {
    emit('update', { ...val })
  },
  { deep: true },
)

const workingDays = [
  { key: 'monday', label: 'Monday', startKey: 'mon_start', endKey: 'mon_end' },
  { key: 'tuesday', label: 'Tuesday', startKey: 'tue_start', endKey: 'tue_end' },
  { key: 'wednesday', label: 'Wednesday', startKey: 'wed_start', endKey: 'wed_end' },
  { key: 'thursday', label: 'Thursday', startKey: 'thu_start', endKey: 'thu_end' },
  { key: 'friday', label: 'Friday', startKey: 'fri_start', endKey: 'fri_end' },
]
</script>

<style scoped>
label {
  gap: 0.5rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

[data-calendar-popup] {
  bottom: 2.5rem !important;
  top: auto !important;
}

.working-hours-day-wrapper {
  background: linear-gradient(90deg, #eef2ff 0%, #f8fafc 100%);
  border-radius: 0.75rem;
  box-shadow: 0 1px 4px 0 rgba(80, 80, 120, 0.06);
  padding: 0.65rem 1rem;
  margin-bottom: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.working-hours-day-label {
  display: flex;
  align-items: center;
  font-size: 1rem;
  color: #3730a3;
  margin-bottom: 0.15rem;
}
</style>
