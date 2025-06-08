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

  const isMobile = computed(() => windowWidth.value < 768)
  const isTablet = computed(() => {
    const isTabletWidth = windowWidth.value >= 768 && windowWidth.value <= 1200 // Expandir para incluir iPad Air
    console.log('Tablet detection:', { 
      windowWidth: windowWidth.value, 
      isTabletWidth,
      range: '768px-1200px'
    })
    return isTabletWidth
  })
  const isDesktop = computed(() => windowWidth.value > 1200)

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
    
    if (isMobile.value) {
      // Desabilitar completamente drag and drop no mobile
      return {
        delay: 0,
        touchStartThreshold: 0,
        forceFallback: false,
        filter: '.kanban-card, .staff-avatar, .draggable', // Bloquear todos os elementos draggable
        preventOnFilter: true,
        disabled: true // Desabilitar SortableJS completamente
      }
    } else {
      // Desktop e Tablet - usar EXATAMENTE a mesma configuração do desktop
      console.log('Desktop/Tablet detected - using desktop config')
      return {
        delay: 0,
        touchStartThreshold: 0,
        forceFallback: false,
        filter: '.no-drag',
        preventOnFilter: true,
        disabled: false
      }
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
    
    if (isMobile.value) {
      // Desabilitar completamente staff drag and drop no mobile
      return {
        delay: 0,
        touchStartThreshold: 0,
        forceFallback: false,
        filter: '.staff-avatar, .draggable', // Bloquear staff avatars
        preventOnFilter: true,
        disabled: true // Desabilitar SortableJS completamente
      }
    } else {
      // Desktop e Tablet - usar EXATAMENTE a mesma configuração do desktop
      console.log('Desktop/Tablet detected - using desktop staff config')
      return {
        delay: 0,
        touchStartThreshold: 0,
        forceFallback: false,
        filter: '.no-drag',
        preventOnFilter: true,
        disabled: false
      }
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
