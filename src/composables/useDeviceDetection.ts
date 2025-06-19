import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useDeviceDetection() {
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)

  const updateDimensions = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  onMounted(() => {
    window.addEventListener('resize', updateDimensions)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateDimensions)
  })

  const isMobile = computed(() => {
    // Phones: UP TO 430x932
    return windowWidth.value <= 430 && windowHeight.value <= 932
  })
  
  const isTablet = computed(() => {
    // Tablets: UP TO 1024x1366
    const isTabletDimensions = (
      windowWidth.value <= 1024 && 
      windowHeight.value <= 1366 &&
      !(windowWidth.value <= 430 && windowHeight.value <= 932) // Not mobile
    )
    
    console.log('Device detection:', { 
      windowWidth: windowWidth.value, 
      windowHeight: windowHeight.value,
      isTabletDimensions,
      isMobile: windowWidth.value <= 430 && windowHeight.value <= 932,
      range: 'Tablet: até 1024x1366, Mobile: até 430x932'
    })
    
    return isTabletDimensions
  })
  
  const isDesktop = computed(() => {
    // Desktop: everything that is not tablet or mobile
    return !isMobile.value && !isTablet.value
  })

  // Detect if it's a touch device
  const isTouchDevice = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  // Detect specifically iPad
  const isIpad = computed(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    return userAgent.includes('ipad') || 
           (userAgent.includes('macintosh') && navigator.maxTouchPoints > 1)
  })

  // Universal drag and drop configurations - no mobile restrictions
  const getDragConfig = () => {
    // Unified configuration that works perfectly on all devices
    return {
      delay: 0,
      touchStartThreshold: 0,
      forceFallback: false,
      filter: '.no-drag',
      preventOnFilter: true,
      disabled: false,
      // Universal optimisations
      fallbackOnBody: true,
      swapThreshold: 0.65,
      dragoverBubble: false,
      removeCloneOnHide: false,
      emptyInsertThreshold: 5
    }
  }

  // Universal staff drag and drop configurations - no mobile restrictions
  const getStaffDragConfig = () => {
    // Unified configuration that works perfectly on all devices
    return {
      delay: 0,
      touchStartThreshold: 0,
      forceFallback: false,
      filter: '.no-drag',
      preventOnFilter: true,
      disabled: false,
      // Universal optimisations
      fallbackOnBody: true,
      swapThreshold: 0.65,
      dragoverBubble: false,
      removeCloneOnHide: false,
      emptyInsertThreshold: 5
    }
  }

  return {
    windowWidth,
    windowHeight,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isIpad,
    getDragConfig,
    getStaffDragConfig
  }
}
