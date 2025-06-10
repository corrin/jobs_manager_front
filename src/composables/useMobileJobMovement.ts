import { ref, computed } from 'vue'
import { useDeviceDetection } from '@/composables/useDeviceDetection'
import type { Job, JobStatus } from '@/types'

export function useMobileJobMovement() {
  const { isMobile, isTablet } = useDeviceDetection()
  
  // State to control movement mode
  const isMovementModeActive = ref(false)
  const selectedJobForMovement = ref<Job | null>(null)
  const showColumnSelector = ref(false)
    // Computed to determine if movement controls should be shown
  const shouldShowMovementControls = computed(() => {
    // Show on mobile and tablet (anything below lg breakpoint - 1024px)
    const shouldShow = window.innerWidth < 1024
    console.log('Movement controls visibility:', {
      isMobile: isMobile.value,
      isTablet: isTablet.value,
      windowWidth: window.innerWidth,
      shouldShow,
      threshold: '< 1024px (lg breakpoint)'
    })
    return shouldShow
  })
  
  // Computed to determine if a job is selected for movement
  const isJobSelectedForMovement = computed(() => {
    return (jobId: string) => selectedJobForMovement.value?.id.toString() === jobId
  })
  // Start movement mode
  const startMovementMode = () => {
    isMovementModeActive.value = true
  }

  // Exit movement mode
  const exitMovementMode = () => {
    isMovementModeActive.value = false
    selectedJobForMovement.value = null
    showColumnSelector.value = false
  }

  // Select job for movement
  const selectJobForMovement = (job: Job) => {
    if (!isMovementModeActive.value) return
    
    selectedJobForMovement.value = job
    showColumnSelector.value = true
  }

  // Move job to new column
  const moveJobToColumn = async (
    targetStatus: string, 
    onMoveJob: (jobId: string, targetStatus: string) => Promise<void>  ) => {
    if (!selectedJobForMovement.value) return

    try {
      await onMoveJob(selectedJobForMovement.value.id.toString(), targetStatus)
      exitMovementMode()
    } catch (error) {
      console.error('Error moving job:', error)
      // Keep mode active for retry
    }
  }

  // Cancel job selection
  const cancelJobSelection = () => {
    selectedJobForMovement.value = null
    showColumnSelector.value = false
  }
  return {
    // State
    isMovementModeActive,
    selectedJobForMovement,
    showColumnSelector,
    shouldShowMovementControls,
    
    // Computeds
    isJobSelectedForMovement,
    
    // Methods
    startMovementMode,
    exitMovementMode,
    selectJobForMovement,
    moveJobToColumn,
    cancelJobSelection
  }
}
