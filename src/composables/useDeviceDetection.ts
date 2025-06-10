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
    // Telefones: ATÉ 430x932
    return windowWidth.value <= 430 && windowHeight.value <= 932
  })
  
  const isTablet = computed(() => {
    // Tablets: ATÉ 1024x1366
    const isTabletDimensions = (
      windowWidth.value <= 1024 && 
      windowHeight.value <= 1366 &&
      !(windowWidth.value <= 430 && windowHeight.value <= 932) // Não é mobile
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
    // Desktop: tudo que não for tablet nem mobile
    return !isMobile.value && !isTablet.value
  })

  // Detectar se é um dispositivo touch
  const isTouchDevice = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  // Detectar especificamente iPad
  const isIpad = computed(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    return userAgent.includes('ipad') || 
           (userAgent.includes('macintosh') && navigator.maxTouchPoints > 1)
  })

  // Configurações otimizadas para drag and drop baseadas no dispositivo
  const getDragConfig = () => {
    console.log('Device detection:', {
      windowWidth: windowWidth.value,
      isMobile: isMobile.value,
      isTablet: isTablet.value,
      isDesktop: isDesktop.value,
      isTouchDevice: isTouchDevice.value,
      isIpad: isIpad.value,
      userAgent: navigator.userAgent
    })
    
    // Configuração padrão otimizada para todos os dispositivos (mobile, tablet, desktop)
    return {
      delay: 0,
      touchStartThreshold: 0,
      forceFallback: false,
      filter: '.no-drag',
      preventOnFilter: true,
      disabled: false
    }
  }

  // Configurações específicas para staff drag and drop
  const getStaffDragConfig = () => {
    console.log('Staff drag device detection:', {
      windowWidth: windowWidth.value,
      isMobile: isMobile.value,
      isTablet: isTablet.value,
      isDesktop: isDesktop.value,
      isTouchDevice: isTouchDevice.value,
      isIpad: isIpad.value
    })
    
    // Configuração padrão otimizada para todos os dispositivos (mobile, tablet, desktop)
    return {
      delay: 0,
      touchStartThreshold: 0,
      forceFallback: false,
      filter: '.no-drag',
      preventOnFilter: true,
      disabled: false
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
