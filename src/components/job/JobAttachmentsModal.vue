<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && closeModal()">
    <DialogContent class="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Job Attachments</DialogTitle>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Upload Area -->
        <div>
          <div
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            @click="triggerFileInput"
          >
            <div class="flex flex-col items-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div class="mt-4">
                <p class="text-sm text-gray-600">
                  <span class="font-medium text-indigo-600 hover:text-indigo-500">
                    Click to upload
                  </span>
                  or drag and drop
                </p>
                <p class="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            multiple
            @change="handleFileChange"
            accept="image/*,.pdf,.doc,.docx,.txt"
            class="hidden"
          >
        </div>

        <!-- Camera Capture Button -->
        <div>
          <button
            @click="capturePhoto"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Capture Photo
          </button>
        </div>

        <!-- Upload Progress -->
        <div v-if="uploadProgress > 0 && uploadProgress < 100">
          <div class="bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <p class="text-sm text-gray-600 mt-1">Uploading... {{ uploadProgress }}%</p>
        </div>

        <!-- Files List -->
        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="file in files"
            :key="file.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <!-- File Icon/Thumbnail -->
              <div class="flex-shrink-0">
                <img
                  v-if="file.thumbnail"
                  :src="file.thumbnail"
                  :alt="file.name"
                  class="w-10 h-10 object-cover rounded"
                >
                <div
                  v-else
                  class="w-10 h-10 bg-gray-300 rounded flex items-center justify-center"
                >
                  <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>

              <!-- File Info -->
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ file.name }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ formatFileSize(file.size) }} • {{ formatDate(file.created) }}
                </p>
              </div>
            </div>

            <!-- File Actions -->
            <div class="flex items-center space-x-2">
              <!-- Print on Job Sheet Toggle -->
              <label class="flex items-center">
                <input
                  v-model="file.printOnJobSheet"
                  @change="updatePrintSetting(file.id, file.printOnJobSheet)"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                <span class="ml-2 text-xs text-gray-600">Print</span>
              </label>

              <!-- Download Button -->
              <button
                @click="downloadFile(file)"
                class="text-indigo-600 hover:text-indigo-900 text-sm"
                title="Download"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </button>

              <!-- Delete Button -->
              <button
                @click="deleteFile(file.id)"
                class="text-red-600 hover:text-red-900 text-sm"
                title="Delete"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- No Files Message -->
          <div v-if="files.length === 0" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No attachments</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by uploading a file.</p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <button
          @click="closeModal"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Close
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// Props
interface Props {
  jobId: string
  isOpen: boolean
}

const props = defineProps<Props>()

// Events
const emit = defineEmits<{
  close: []
  'file-uploaded': [file: JobFile]
  'file-deleted': [fileId: string]
}>()

// Types
interface JobFile {
  id: string
  name: string
  size: number
  type: string
  created: string
  thumbnail?: string
  printOnJobSheet: boolean
  url: string
}

// Reactive state
const files = ref<JobFile[]>([])
const uploadProgress = ref(0)
const fileInput = ref<HTMLInputElement>()

// Methods
const closeModal = () => {
  emit('close')
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFiles(Array.from(target.files))
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files) {
    handleFiles(Array.from(event.dataTransfer.files))
  }
}

const handleFiles = async (fileList: File[]) => {
  for (const file of fileList) {
    await uploadFile(file)
  }
}

const uploadFile = async (file: File) => {
  uploadProgress.value = 0

  try {
    // Create FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_id', props.jobId)

    // Simulate upload progress (replace with actual upload logic)
    const simulateProgress = () => {
      return new Promise<void>((resolve) => {
        let progress = 0
        const interval = setInterval(() => {
          progress += 10
          uploadProgress.value = progress
          if (progress >= 100) {
            clearInterval(interval)
            resolve()
          }
        }, 100)
      })
    }

    await simulateProgress()

    // Create file object (replace with actual API response)
    const newFile: JobFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      created: new Date().toISOString(),
      printOnJobSheet: false,
      url: URL.createObjectURL(file),
      thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }

    files.value.push(newFile)
    emit('file-uploaded', newFile)
    uploadProgress.value = 0

    // TODO: Replace with actual API call
    // const response = await jobRestService.uploadFile(props.jobId, formData)

  } catch (error) {
    console.error('Upload failed:', error)
    uploadProgress.value = 0
    // TODO: Show error message
  }
}

const capturePhoto = async () => {
  try {
    // TODO: Implement camera capture
    // This would open a camera modal similar to the Django version
    console.log('Camera capture not implemented yet')
  } catch (error) {
    console.error('Camera capture failed:', error)
  }
}

const downloadFile = (file: JobFile) => {
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const deleteFile = async (fileId: string) => {
  if (!confirm('Are you sure you want to delete this file?')) {
    return
  }

  try {
    // TODO: API call to delete file
    // await jobRestService.deleteFile(fileId)

    files.value = files.value.filter(f => f.id !== fileId)
    emit('file-deleted', fileId)
  } catch (error) {
    console.error('Delete failed:', error)
  }
}

const updatePrintSetting = async (fileId: string, printOnJobSheet: boolean) => {
  try {
    // TODO: API call to update print setting
    // await jobRestService.updateFilePrintSetting(fileId, printOnJobSheet)
    console.log(`Updated print setting for ${fileId}: ${printOnJobSheet}`)
  } catch (error) {
    console.error('Update print setting failed:', error)
  }
}

const loadFiles = async () => {
  try {
    // TODO: Load existing files from API
    // const response = await jobRestService.getJobFiles(props.jobId)
    // files.value = response.files

    // For now, using mock data
    files.value = []
  } catch (error) {
    console.error('Failed to load files:', error)
  }
}

// Utility functions
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Load files when modal opens
onMounted(() => {
  if (props.isOpen) {
    loadFiles()
  }
})
</script>
