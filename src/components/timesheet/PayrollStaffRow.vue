<template>
  <tr class="group hover:bg-blue-50/30 transition-all duration-200 border-b border-gray-200">
    <!-- Staff Member Column with Expand/Collapse -->
    <td class="px-1.5 lg:px-2 py-1.5 lg:py-2">
      <div class="flex items-center space-x-1.5 lg:space-x-2">
        <!-- Expand/Collapse Button -->
        <button
          @click="toggleExpanded"
          class="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
        >
          <ChevronRight
            :class="['h-4 w-4 text-gray-500 transition-transform', { 'rotate-90': isExpanded }]"
          />
        </button>

        <!-- Avatar -->
        <div class="flex-shrink-0 h-6 lg:h-7 w-6 lg:w-7">
          <div
            class="h-6 lg:h-7 w-6 lg:w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
          >
            <span class="text-xs lg:text-sm font-semibold text-white">
              {{ getInitials(staff.name) }}
            </span>
          </div>
        </div>

        <!-- Staff Name -->
        <div class="min-w-0 flex-1">
          <p class="text-sm lg:text-base font-medium text-gray-900 truncate">
            {{ staff.name }}
          </p>
        </div>
      </div>
    </td>

    <!-- Daily Hours Columns - Show aggregated totals -->
    <td v-for="idx in visibleIndexes" :key="idx" class="px-1 py-1.5 lg:py-2 text-center relative">
      <div class="flex items-center justify-center min-h-[28px] lg:min-h-[32px]">
        <span v-if="staff.weekly_hours[idx].hours > 0" class="text-xs lg:text-sm font-medium">
          {{ formatHours(staff.weekly_hours[idx].hours) }}
        </span>
        <span v-else class="text-xs lg:text-sm text-gray-400">-</span>
      </div>
    </td>

    <!-- Total Hours Column -->
    <td class="px-1.5 lg:px-2 py-1.5 lg:py-2 text-center">
      <div class="flex flex-col items-center space-y-1">
        <span class="text-sm lg:text-base font-bold text-gray-900">
          {{ formatHours(staff.total_hours) }}
        </span>
        <!-- Hour Type Indicators -->
        <div class="flex items-center space-x-0.5 lg:space-x-1">
          <Check
            v-if="staff.total_billed_hours > 0"
            class="h-3 w-3 lg:h-3.5 lg:w-3.5 text-green-600"
            :title="`Billed: ${formatHours(staff.total_billed_hours)}h`"
          />
          <X
            v-if="staff.total_unbilled_hours > 0"
            class="h-3 w-3 lg:h-3.5 lg:w-3.5 text-gray-500"
            :title="`Unbilled: ${formatHours(staff.total_unbilled_hours)}h`"
          />
          <span
            v-if="staff.total_overtime_1_5x_hours > 0"
            class="text-[10px] lg:text-xs font-bold text-orange-600"
            :title="`1.5x Time: ${formatHours(staff.total_overtime_1_5x_hours)}h`"
            >1.5</span
          >
          <span
            v-if="staff.total_overtime_2x_hours > 0"
            class="text-[10px] lg:text-xs font-bold text-red-600"
            :title="`2x Time: ${formatHours(staff.total_overtime_2x_hours)}h`"
            >2x</span
          >
          <Heart
            v-if="staff.total_sick_leave_hours > 0"
            class="h-3 w-3 lg:h-3.5 lg:w-3.5 text-blue-600"
            :title="`Sick Leave: ${formatHours(staff.total_sick_leave_hours)}h`"
          />
          <Plane
            v-if="staff.total_annual_leave_hours > 0"
            class="h-3 w-3 lg:h-3.5 lg:w-3.5 text-purple-600"
            :title="`Annual Leave: ${formatHours(staff.total_annual_leave_hours)}h`"
          />
        </div>
      </div>
    </td>

    <!-- Billable Hours Column -->
    <td class="px-1.5 lg:px-2 py-1.5 lg:py-2 text-center">
      <span class="text-sm lg:text-base font-medium text-gray-700">
        {{ formatHours(staff.total_billable_hours) }}h
      </span>
    </td>
  </tr>

  <!-- Expanded Hour Type Breakdown Rows -->
  <template v-if="isExpanded">
    <!-- Billed Time -->
    <tr v-if="staff.total_billed_hours > 0" class="bg-green-50/30">
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 pl-12">
        <span class="text-xs lg:text-sm text-green-700">Billed Time</span>
      </td>
      <td
        v-for="idx in visibleIndexes"
        :key="`billed-${idx}`"
        class="px-1 py-1 lg:py-1.5 text-center"
      >
        <span class="text-xs text-green-600">
          {{
            staff.weekly_hours[idx].billed_hours > 0
              ? formatHours(staff.weekly_hours[idx].billed_hours)
              : '-'
          }}
        </span>
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 text-center">
        <span class="text-xs lg:text-sm font-medium text-green-700"
          >{{ formatHours(staff.total_billed_hours) }}h</span
        >
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5"></td>
    </tr>

    <!-- Unbilled Time -->
    <tr v-if="staff.total_unbilled_hours > 0" class="bg-gray-50/30">
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 pl-12">
        <span class="text-xs lg:text-sm text-gray-700">Unbilled Time</span>
      </td>
      <td
        v-for="idx in visibleIndexes"
        :key="`unbilled-${idx}`"
        class="px-1 py-1 lg:py-1.5 text-center"
      >
        <span class="text-xs text-gray-600">
          {{
            staff.weekly_hours[idx].unbilled_hours > 0
              ? formatHours(staff.weekly_hours[idx].unbilled_hours)
              : '-'
          }}
        </span>
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 text-center">
        <span class="text-xs lg:text-sm font-medium text-gray-700"
          >{{ formatHours(staff.total_unbilled_hours) }}h</span
        >
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5"></td>
    </tr>

    <!-- 1.5x Time -->
    <tr v-if="staff.total_overtime_1_5x_hours > 0" class="bg-orange-50/30">
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 pl-12">
        <span class="text-xs lg:text-sm text-orange-700">1.5x Time</span>
      </td>
      <td
        v-for="idx in visibleIndexes"
        :key="`ot15-${idx}`"
        class="px-1 py-1 lg:py-1.5 text-center"
      >
        <span class="text-xs text-orange-600">
          {{
            staff.weekly_hours[idx].overtime_1_5x_hours > 0
              ? formatHours(staff.weekly_hours[idx].overtime_1_5x_hours)
              : '-'
          }}
        </span>
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 text-center">
        <span class="text-xs lg:text-sm font-medium text-orange-700"
          >{{ formatHours(staff.total_overtime_1_5x_hours) }}h</span
        >
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5"></td>
    </tr>

    <!-- 2x Time -->
    <tr v-if="staff.total_overtime_2x_hours > 0" class="bg-red-50/30">
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 pl-12">
        <span class="text-xs lg:text-sm text-red-700">2x Time</span>
      </td>
      <td
        v-for="idx in visibleIndexes"
        :key="`ot2x-${idx}`"
        class="px-1 py-1 lg:py-1.5 text-center"
      >
        <span class="text-xs text-red-600">
          {{
            staff.weekly_hours[idx].overtime_2x_hours > 0
              ? formatHours(staff.weekly_hours[idx].overtime_2x_hours)
              : '-'
          }}
        </span>
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 text-center">
        <span class="text-xs lg:text-sm font-medium text-red-700"
          >{{ formatHours(staff.total_overtime_2x_hours) }}h</span
        >
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5"></td>
    </tr>

    <!-- Sick Leave -->
    <tr v-if="staff.total_sick_leave_hours > 0" class="bg-blue-50/30">
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 pl-12">
        <span class="text-xs lg:text-sm text-blue-700">Sick Leave</span>
      </td>
      <td
        v-for="idx in visibleIndexes"
        :key="`sick-${idx}`"
        class="px-1 py-1 lg:py-1.5 text-center"
      >
        <span class="text-xs text-blue-600">
          {{
            staff.weekly_hours[idx].sick_leave_hours > 0
              ? formatHours(staff.weekly_hours[idx].sick_leave_hours)
              : '-'
          }}
        </span>
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 text-center">
        <span class="text-xs lg:text-sm font-medium text-blue-700"
          >{{ formatHours(staff.total_sick_leave_hours) }}h</span
        >
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5"></td>
    </tr>

    <!-- Annual Leave -->
    <tr v-if="staff.total_annual_leave_hours > 0" class="bg-purple-50/30">
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 pl-12">
        <span class="text-xs lg:text-sm text-purple-700">Annual Leave</span>
      </td>
      <td
        v-for="idx in visibleIndexes"
        :key="`annual-${idx}`"
        class="px-1 py-1 lg:py-1.5 text-center"
      >
        <span class="text-xs text-purple-600">
          {{
            staff.weekly_hours[idx].annual_leave_hours > 0
              ? formatHours(staff.weekly_hours[idx].annual_leave_hours)
              : '-'
          }}
        </span>
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5 text-center">
        <span class="text-xs lg:text-sm font-medium text-purple-700"
          >{{ formatHours(staff.total_annual_leave_hours) }}h</span
        >
      </td>
      <td class="px-1.5 lg:px-2 py-1 lg:py-1.5"></td>
    </tr>
  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight, Check, X, Heart, Plane } from 'lucide-vue-next'
import { formatHours } from '@/services/weekly-timesheet.service'
import { z } from 'zod'
import { schemas } from '@/api/generated/api'

type WeeklyStaffData = z.infer<typeof schemas.WeeklyStaffData>

interface Props {
  staff: WeeklyStaffData
  visibleIndexes: number[]
}

defineProps<Props>()

const isExpanded = ref(false)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>
