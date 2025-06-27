<template>
  <Dialog :open="true" @update:open="handleClose">
    <DialogContent class="max-w-xl space-y-6 animate-in fade-in-0 zoom-in-95 ai-dialog-content">
      <DialogHeader>
        <DialogTitle>
          <span class="text-lg">Manage AI Providers</span>
          <i class="ml-2 text-indigo-600" aria-hidden="true">⚙️</i>
        </DialogTitle>
      </DialogHeader>
      <DialogDescription class="text-sm text-gray-500">
        Configure and manage your AI providers. Set default providers and ensure all fields are
        correctly filled.
      </DialogDescription>
      <div class="space-y-4 ai-providers-scroll">
        <div
          v-for="(provider, idx) in localProviders"
          :key="provider.id || idx"
          class="ai-provider-inline mx-auto"
        >
          <div class="flex flex-wrap gap-2 items-center w-full justify-center">
            <input
              v-model="localProviders[idx].name"
              class="input ai-input"
              placeholder="Provider Name"
            />
            <input
              v-model="localProviders[idx].model_name"
              class="input ai-input"
              placeholder="Model"
            />
            <select v-model="localProviders[idx].provider_type" class="input ai-input">
              <option value="openai">OpenAI</option>
              <option value="google">Google</option>
              <option value="mistral">Mistral</option>
              <option value="Gemini">Gemini</option>
            </select>
            <input
              v-model="localProviders[idx].api_key"
              class="input ai-input"
              placeholder="API Key"
            />
            <label class="flex items-center gap-1 whitespace-nowrap">
              <Checkbox v-model="localProviders[idx].default" @change="setDefault(idx)" /> Default
            </label>
            <Button variant="ghost" size="sm" class="ai-remove-btn" @click="removeProvider(idx)"
              >Remove</Button
            >
          </div>
        </div>
      </div>
      <div class="flex gap-2 justify-end mt-4">
        <Button
          type="button"
          variant="outline"
          @click="handleClose"
          class="ai-close-btn flex items-center gap-1"
        >
          <ArrowLeft class="w-4 h-4" /> Close
        </Button>
        <Button
          type="button"
          variant="outline"
          @click="addProvider"
          class="ai-close-btn flex items-center gap-1"
        >
          <span class="text-lg font-bold">+</span> Add Provider
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import Button from '@/components/ui/button/Button.vue'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
import { ref, watch } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'

interface AIProvider {
  id?: string
  name: string
  provider_type: string
  model_name: string
  api_key: string
  default: boolean
}

const props = defineProps<{ providers: AIProvider[] }>()
const emit = defineEmits(['close', 'saved'])
const providers = ref(props.providers.map((p) => ({ ...p })))
const localProviders = ref<AIProvider[]>(props.providers.map((p) => ({ ...p })))

console.log('[AIProvidersDialog] props.providers:', props.providers)
console.log('[AIProvidersDialog] local providers:', providers.value)

// Local copy for editing, always in sync with props
// Sync local copy if parent changes (e.g. modal reopens)
watch(
  () => props.providers,
  (newVal) => {
    localProviders.value = newVal.map((p) => ({ ...p }))
  },
  { deep: true },
)

function handleClose() {
  emit('close')
}
function addProvider() {
  localProviders.value.push({
    name: '',
    provider_type: 'openai',
    model_name: '',
    api_key: '',
    default: false,
  })
  emitProviders()
}
function removeProvider(idx: number) {
  localProviders.value.splice(idx, 1)
  emitProviders()
}
function setDefault(idx: number) {
  localProviders.value.forEach((p, i) => {
    p.default = i === idx
  })
  emitProviders()
}
// Emit changes to parent on any edit
watch(localProviders, emitProviders, { deep: true })

function emitProviders() {
  emit(
    'update:providers',
    localProviders.value.map((p) => ({ ...p })),
  )
}
</script>

<style scoped>
.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #c7d2fe;
  border-radius: 0.5rem;
  background: #f8fafc;
  font-size: 0.875rem;
  transition:
    border 0.2s,
    box-shadow 0.2s;
}
.input:focus {
  border-color: #6366f1;
  outline: none;
  box-shadow: 0 0 0 2px #a5b4fc66;
}
.ai-provider-inline {
  background: linear-gradient(90deg, #e0e7ff 0%, #f1f5f9 100%);
  border-radius: 0.75rem;
  box-shadow: 0 2px 12px 0 rgba(80, 80, 120, 0.08);
  padding: 1rem 1.25rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
  position: relative;
  overflow-x: auto;
  max-width: 700px;
}
.ai-provider-inline:hover {
  box-shadow: 0 4px 24px 0 rgba(80, 80, 120, 0.13);
  transform: scale(1.01);
}
.ai-input {
  min-width: 90px;
  max-width: 160px;
  flex: 1 1 120px;
  margin-right: 0.5rem;
  background: #f8fafc;
}
.ai-remove-btn {
  color: #a21caf;
  background: transparent;
  border-radius: 0.5rem;
  transition:
    background 0.2s,
    color 0.2s;
}
.ai-remove-btn:hover {
  background: #f3e8ff;
  color: #7c3aed;
}
.ai-add-btn {
  background: linear-gradient(90deg, #c7d2fe 0%, #e0e7ff 100%);
  color: #3730a3;
  border-radius: 0.5rem;
  font-weight: 600;
  box-shadow: 0 1px 4px 0 rgba(80, 80, 120, 0.08);
  transition:
    background 0.2s,
    color 0.2s;
}
.ai-add-btn:hover {
  background: linear-gradient(90deg, #a5b4fc 0%, #c7d2fe 100%);
  color: #312e81;
}
.ai-close-btn {
  min-width: 100px;
  border-radius: 0.5rem;
  font-weight: 500;
  background: linear-gradient(90deg, #f1f5f9 0%, #e0e7ff 100%);
  color: #3730a3;
  box-shadow: 0 1px 4px 0 rgba(80, 80, 120, 0.08);
  transition:
    background 0.2s,
    color 0.2s;
}
.ai-close-btn:hover {
  background: linear-gradient(90deg, #c7d2fe 0%, #a5b4fc 100%);
  color: #312e81;
}
.dialog-content {
  animation: fadeIn 0.5s;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.ai-dialog-content {
  max-height: 80vh;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.ai-providers-scroll {
  max-height: 45vh;
  overflow-y: auto;
  padding-right: 2px;
  margin-bottom: 0.5rem;
}
@media (max-width: 600px) {
  .ai-dialog-content {
    min-width: 0;
    max-width: 98vw;
    padding: 0.5rem;
  }
  .ai-provider-inline {
    padding: 0.5rem 0.5rem;
    max-width: 98vw;
  }
  .ai-input {
    min-width: 70px;
    max-width: 110px;
    font-size: 0.8rem;
  }
}
</style>
