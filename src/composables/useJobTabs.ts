import { ref } from 'vue'
import type { JobTabKey } from '@/constants/job-tabs'

export function useJobTabs(initialTab: JobTabKey = 'estimate') {
  const activeTab = ref<JobTabKey>(initialTab)

  function setTab(tab: JobTabKey) {
    activeTab.value = tab
  }

  function isTab(tab: JobTabKey) {
    return activeTab.value === tab
  }

  return {
    activeTab,
    setTab,
    isTab,
  }
}
