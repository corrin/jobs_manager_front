<template>
  <AppLayout>
    <div class="w-full h-full flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto p-0">
        <div class="max-w-5xl mx-auto py-6 px-2 md:px-8 h-full flex flex-col gap-6">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-2xl font-bold text-indigo-700 flex items-center gap-2">
              <Building2 class="w-7 h-7 text-indigo-400 animate-pulse" />
              Company Defaults
            </h1>
          </div>
          <div class="flex flex-col items-center justify-center" style="height: 60vh">
            <div class="grid grid-cols-3 gap-6 mb-6 w-full max-w-3xl">
              <button class="section-btn" @click="openSection('general')">
                <Settings class="w-12 h-12 mb-2" />
                <span>General</span>
              </button>
              <button class="section-btn" @click="openSection('google')">
                <FileText class="w-12 h-12 mb-2" />
                <span>Google Sheets</span>
              </button>
              <button class="section-btn" @click="openSection('xero')">
                <Link2 class="w-12 h-12 mb-2" />
                <span>Xero Integration</span>
              </button>
            </div>
            <div class="grid grid-cols-3 gap-6 w-full max-w-3xl">
              <button class="section-btn" @click="openSection('kpi')">
                <BarChart3 class="w-12 h-12 mb-2" />
                <span>KPI & Thresholds</span>
              </button>
              <button class="section-btn" @click="openSection('working_hours')">
                <Clock class="w-12 h-12 mb-2" />
                <span>Working Hours</span>
              </button>
              <button class="section-btn" @click="openAIProvidersDialog">
                <Sparkles class="w-12 h-12 mb-2" />
                <span>AI Providers</span>
              </button>
            </div>
          </div>
          <div class="flex justify-center mt-8">
            <Button
              type="button"
              variant="default"
              class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 flex items-center gap-2 text-base font-semibold rounded shadow"
              @click="saveAll"
            >
              <Save class="w-5 h-5" /> Save All
            </Button>
          </div>
          <SectionModal
            v-if="modalSection"
            :section="modalSection"
            :form="form"
            @close="closeSection"
            @update="onSectionUpdate"
          />
        </div>
      </div>
      <AIProvidersDialog
        v-if="showAIProvidersDialog"
        :providers="form.ai_providers"
        @close="closeAIProvidersDialog"
        @saved="onSaved"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { ref, onMounted } from 'vue'
import {
  Building2,
  Save,
  Settings,
  FileText,
  Link2,
  BarChart3,
  Sparkles,
  Clock,
} from 'lucide-vue-next'
import AIProvidersDialog from '@/components/AIProvidersDialog.vue'
import SectionModal from '@/components/SectionModal.vue'
import {
  getCompanyDefaults,
  updateCompanyDefaults,
  CompanyDefaults,
} from '@/services/admin-company-defaults-service'
import { toast } from 'vue-sonner'

const companyDefaults = ref<CompanyDefaults>({ ai_providers: [] } as CompanyDefaults)
const form = ref<CompanyDefaults>({ ai_providers: [] } as CompanyDefaults)
const loading = ref(true)
const showAIProvidersDialog = ref(false)
const modalSection = ref<string | null>(null)

debugLog('[AdminCompanyView] companyDefaults:', companyDefaults.value)
debugLog('[AdminCompanyView] form:', form.value)

function openAIProvidersDialog() {
  debugLog('[AdminCompanyView] openAIProvidersDialog, form.ai_providers:', form.value.ai_providers)
  showAIProvidersDialog.value = true
}
function closeAIProvidersDialog() {
  showAIProvidersDialog.value = false
}
async function fetchDefaults() {
  loading.value = true
  const data = await getCompanyDefaults()
  debugLog('[AdminCompanyView] getCompanyDefaults() result:', data)
  companyDefaults.value = data
  form.value = JSON.parse(JSON.stringify(data))
  debugLog('[AdminCompanyView] form after fetch:', form.value)
  loading.value = false
}
async function saveAll() {
  loading.value = true
  try {
    await updateCompanyDefaults(form.value)
    toast.success('Company defaults saved successfully!')
    await fetchDefaults()
  } catch {
    toast.error('Failed to save company defaults.')
  }
  loading.value = false
}
function onSaved() {
  fetchDefaults()
  closeAIProvidersDialog()
}
function openSection(section: string) {
  modalSection.value = section
}
function closeSection() {
  modalSection.value = null
}
function onSectionUpdate(newData: Partial<CompanyDefaults>) {
  Object.assign(form.value, newData)
}
onMounted(fetchDefaults)
</script>

<style scoped>
.section-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 0.75rem;
  box-shadow: 0 2px 12px 0 rgba(80, 80, 120, 0.08);
  padding: 1.5rem;
  color: #3730a3;
  font-weight: 600;
  font-size: 1.125rem;
  transition:
    background 0.2s,
    transform 0.2s;
  min-width: 160px;
  min-height: 140px;
  border: none;
  outline: none;
  cursor: pointer;
}
.section-btn:hover,
.section-btn:focus {
  background: linear-gradient(135deg, #c7d2fe 0%, #e0e7ff 100%);
  transform: scale(1.05);
  box-shadow: 0 4px 24px 0 rgba(80, 80, 120, 0.13);
}
</style>
