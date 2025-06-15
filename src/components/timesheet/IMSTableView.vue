<template>
  <div class="ims-table-view flex flex-col" style="height: 600px;">
    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-gray-500">Loading IMS data...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-red-500">{{ error }}</div>
    </div>

    <!-- IMS Table -->
    <div v-else class="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
      <!-- Fixed Header -->
      <div class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div class="overflow-hidden">
          <table class="w-full table-fixed ims-table">
            <colgroup>
              <col style="width: 150px;" />
              <col v-for="day in weekDays" :key="day.dateStr" style="width: 150px;" />
              <col style="width: 150px;" />
              <col style="width: 150px;" />
            </colgroup>
            
            <thead>
              <tr>
                <th class="p-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                  Staff Member
                </th>
                <th 
                  v-for="day in weekDays" 
                  :key="day.dateStr"
                  class="p-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600"
                  :class="{ 
                    'bg-blue-50 dark:bg-blue-900/20': isToday(day.date),
                    'bg-amber-50 dark:bg-amber-900/20': day.isNextWeek
                  }"
                >
                  <div>{{ day.dayName }}</div>
                  <div class="text-xs font-normal text-gray-500 dark:text-gray-400">{{ day.dayNum }}</div>
                  <div v-if="day.isNextWeek" class="text-xs font-normal text-amber-600 dark:text-amber-400">
                    (Next Week)
                  </div>
                </th>
                <th class="p-3 text-center text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">
                  Weekly Total
                </th>
                <th class="p-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Billable Hours
                </th>
              </tr>
            </thead>
          </table>
        </div>
      </div>

      <!-- Scrollable Body -->
      <div class="flex-1 overflow-y-auto">
        <table class="w-full table-fixed ims-table">
          <colgroup>
            <col style="width: 150px;" />
            <col v-for="day in weekDays" :key="day.dateStr" style="width: 150px;" />
            <col style="width: 150px;" />
            <col style="width: 150px;" />
          </colgroup>

          <!-- Table Body -->
          <tbody class="bg-white dark:bg-gray-800">
            <tr
              v-for="staffData in staffList"
              :key="staffData.staff_id"
              class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <!-- Staff Name Column -->
              <td class="p-3 border-r border-gray-200 dark:border-gray-600">
                <div class="flex items-center gap-2">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ staffData.staff_name || 'Unknown' }}
                  </div>
                </div>
              </td>

              <!-- Day Columns -->
              <td
                v-for="(day, dayIndex) in weekDays"
                :key="`${staffData.staff_id}-${dayIndex}`"
                class="p-2 border-r border-gray-200 dark:border-gray-600 align-top"
                :class="{
                  'bg-blue-50/50 dark:bg-blue-900/10': isToday(day.date),
                  'bg-amber-50/50 dark:bg-amber-900/10': day.isNextWeek
                }"
              >
                <template v-if="getDayData(staffData, day)">
                  <div class="space-y-2 min-h-[120px]">
                    <!-- Total Header -->
                    <div class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-semibold flex justify-between">
                      <span class="text-blue-600 dark:text-blue-400">Total</span>
                      <span class="text-gray-900 dark:text-white">{{ formatHours(getDayData(staffData, day)!.total_hours) }}</span>
                    </div>

                    <!-- Work Hours Section -->
                    <div v-if="hasWorkHours(getDayData(staffData, day))" class="bg-green-50 dark:bg-green-900/20 border-l-2 border-green-400 px-2 py-1 rounded">
                      <div class="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Work Hours</div>
                      
                      <div v-if="getDayData(staffData, day)!.standard_hours > 0" class="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                        <span>Standard</span>
                        <span class="font-medium">{{ formatHours(getDayData(staffData, day)!.standard_hours) }}</span>
                      </div>
                      
                      <div v-if="getDayData(staffData, day)!.time_and_half_hours > 0" class="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                        <span>1.5x</span>
                        <span class="font-medium">{{ formatHours(getDayData(staffData, day)!.time_and_half_hours) }}</span>
                      </div>
                      
                      <div v-if="getDayData(staffData, day)!.double_time_hours > 0" class="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                        <span>2x</span>
                        <span class="font-medium">{{ formatHours(getDayData(staffData, day)!.double_time_hours) }}</span>
                      </div>

                      <!-- Overtime indicator if over 8 hours -->
                      <div v-if="getDayData(staffData, day)!.total_hours > 8" class="mt-1 px-1 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded text-xs">
                        <span class="text-orange-600 dark:text-orange-400 font-medium">OT: {{ formatHours(getDayData(staffData, day)!.total_hours - 8) }}</span>
                      </div>
                    </div>

                    <!-- Leave Hours Section -->
                    <div v-if="getDayData(staffData, day)!.leave_hours > 0" class="space-y-1">
                      <div 
                        v-if="getLeaveType(getDayData(staffData, day)!.leave_type) === 'Annual'"
                        class="bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-400 px-2 py-1 rounded"
                      >
                        <div class="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">Annual Leave</div>
                        <div class="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                          <span>Hours</span>
                          <span class="font-medium">{{ formatHours(getDayData(staffData, day)!.leave_hours) }}</span>
                        </div>
                      </div>

                      <div 
                        v-else-if="getLeaveType(getDayData(staffData, day)!.leave_type) === 'Sick'"
                        class="bg-red-50 dark:bg-red-900/20 border-l-2 border-red-400 px-2 py-1 rounded"
                      >
                        <div class="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Sick Leave</div>
                        <div class="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                          <span>Hours</span>
                          <span class="font-medium">{{ formatHours(getDayData(staffData, day)!.leave_hours) }}</span>
                        </div>
                      </div>

                      <div 
                        v-else
                        class="bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-400 px-2 py-1 rounded"
                      >
                        <div class="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Other Leave</div>
                        <div class="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                          <span>Hours</span>
                          <span class="font-medium">{{ formatHours(getDayData(staffData, day)!.leave_hours) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Status Indicator -->
                    <div class="flex justify-center pt-2">
                      <div v-if="getDayData(staffData, day)!.total_hours >= 8" class="w-full p-1 bg-green-100 dark:bg-green-900/30 rounded text-center">
                        <span class="text-green-600 dark:text-green-400 text-lg">✓</span>
                      </div>
                      <div v-else-if="getDayData(staffData, day)!.total_hours > 0" class="w-full p-1 bg-amber-100 dark:bg-amber-900/30 rounded text-center">
                        <span class="text-amber-600 dark:text-amber-400 text-lg">⚠</span>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="min-h-[120px] flex items-center justify-center">
                    <span class="text-gray-400 text-2xl">-</span>
                  </div>
                </template>
              </td>

              <!-- Summary Columns -->
              <td class="p-3 text-center border-r border-gray-200 dark:border-gray-600">
                <div class="space-y-1">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ formatHours(staffData.total_work_hours + staffData.total_leave_hours) }}
                  </div>
                  <div v-if="staffData.total_work_hours > 0" class="text-xs text-green-600 dark:text-green-400">
                    Work: {{ formatHours(staffData.total_work_hours) }}
                  </div>
                  <div v-if="staffData.total_leave_hours > 0" class="text-xs text-yellow-600 dark:text-yellow-400">
                    Leave: {{ formatHours(staffData.total_leave_hours) }}
                  </div>
                </div>
              </td>

              <td class="p-3 text-center">
                <div class="space-y-1">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ formatHours(staffData.total_billable_hours) }}
                  </div>
                  <div class="text-xs text-blue-600 dark:text-blue-400">
                    {{ formatPercentage(staffData.billable_percentage) }}%
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface IMSDayData {
  total_hours: number
  standard_hours: number
  time_and_half_hours: number
  double_time_hours: number
  leave_hours: number
  leave_type?: string
  notes?: string
}

interface IMSStaffData {
  staff_id: string
  staff_name: string
  total_work_hours: number
  total_leave_hours: number
  total_billable_hours: number
  billable_percentage: number
  days: Record<string, IMSDayData>
}

interface WeekDay {
  date: Date
  dateStr: string
  dayName: string
  dayNum: string
  isNextWeek: boolean
}

interface Props {
  staffList: IMSStaffData[]
  weekDays: WeekDay[]
  loading?: boolean
  error?: string
}

const props = defineProps<Props>()

// Helper functions
const formatHours = (hours: number | undefined | null): string => {
  if (!hours || hours === 0) return '0.0'
  return hours.toFixed(1)
}

const formatPercentage = (percentage: number | undefined | null): string => {
  if (!percentage || percentage === 0) return '0'
  return Math.round(percentage).toString()
}

const isToday = (date: Date): boolean => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false
  }
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const getDayData = (staffData: IMSStaffData, day: WeekDay): IMSDayData | null => {
  const dayKey = day.dateStr // Format: YYYY-MM-DD
  return staffData.days?.[dayKey] || null
}

const hasWorkHours = (dayData: IMSDayData | null): boolean => {
  if (!dayData) return false
  return (dayData.standard_hours > 0) ||
         (dayData.time_and_half_hours > 0) ||
         (dayData.double_time_hours > 0)
}

const getLeaveType = (leaveType: string | undefined | null): string => {
  if (!leaveType) return 'Other'
  
  const lowerType = leaveType.toLowerCase()
  if (lowerType.includes('annual')) return 'Annual'
  if (lowerType.includes('sick')) return 'Sick'
  return 'Other'
}

const getLeaveTypeLabel = (leaveType: string | undefined | null): string => {
  if (!leaveType) return 'Leave'

  const leaveTypes: Record<string, string> = {
    'annual': 'Annual',
    'sick': 'Sick',
    'personal': 'Personal',
    'public_holiday': 'Public Holiday',
    'bereavement': 'Bereavement',
    'parental': 'Parental',
    'other': 'Other'
  }

  return leaveTypes[leaveType.toLowerCase()] || leaveType
}
</script>

<style scoped>
.ims-table {
  border-collapse: separate;
  border-spacing: 0;
}

.ims-day-cell {
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: left;
  font-size: 0.75rem;
}

.ims-total-hours {
  background-color: rgb(243 244 246);
  padding: 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
  text-align: center;
  color: rgb(17 24 39);
}

.dark .ims-total-hours {
  background-color: rgb(55 65 81);
  color: rgb(243 244 246);
}

.ims-work-breakdown {
  background-color: rgb(240 253 244);
  border-left: 3px solid rgb(34 197 94);
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.dark .ims-work-breakdown {
  background-color: rgba(34, 197, 94, 0.1);
}

.ims-leave-breakdown {
  background-color: rgb(254 249 195);
  border-left: 3px solid rgb(234 179 8);
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.dark .ims-leave-breakdown {
  background-color: rgba(234, 179, 8, 0.1);
}

.ims-section-header {
  font-weight: 600;
  font-size: 0.65rem;
  margin-bottom: 0.125rem;
  color: rgb(17 24 39);
}

.dark .ims-section-header {
  color: rgb(243 244 246);
}

.ims-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: rgb(75 85 99);
}

.dark .ims-detail-row {
  color: rgb(156 163 175);
}

.ims-notes {
  font-size: 0.65rem;
  color: rgb(107 114 128);
  font-style: italic;
}

.dark .ims-notes {
  color: rgb(156 163 175);
}

.ims-empty-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: rgb(156 163 175);
  font-size: 0.875rem;
}

/* Scroll styling for better UX */
.ims-table-view {
  height: 600px;
}

.ims-table-view .overflow-y-auto {
  /* Let flexbox handle the height */
  overflow-y: auto;
}

.ims-table-view .overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.ims-table-view .overflow-y-auto::-webkit-scrollbar-track {
  background: rgb(243 244 246);
  border-radius: 4px;
}

.dark .ims-table-view .overflow-y-auto::-webkit-scrollbar-track {
  background: rgb(55 65 81);
}

.ims-table-view .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgb(156 163 175);
  border-radius: 4px;
}

.ims-table-view .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgb(107 114 128);
}

.dark .ims-table-view .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgb(107 114 128);
}

.dark .ims-table-view .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgb(75 85 99);
}

/* Ensure tables align properly */
.ims-table {
  table-layout: fixed;
  width: 100%;
}

/* Smooth scrolling */
.ims-table-view .overflow-y-auto {
  scroll-behavior: smooth;
}
</style>
