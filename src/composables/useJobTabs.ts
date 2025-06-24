import { ref } from 'vue'

export type JobTabKey = 'estimate' | 'quote' | 'financial' | 'costAnalysis'

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
