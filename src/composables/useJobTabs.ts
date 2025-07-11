import { ref } from 'vue'

/**

 * @deprecated Use generated types from src/api/generated instead

 * This interface will be removed after migration to openapi-zod-client generated types

 */

export type JobTabKey = 'estimate' | 'quote' | 'actual' | 'financial' | 'costAnalysis'

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
