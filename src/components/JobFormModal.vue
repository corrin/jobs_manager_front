<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-md animate-in fade-in-0 zoom-in-95">
      <DialogHeader>
        <DialogTitle>{{ job ? 'Edit Django Job' : 'New Django Job' }}</DialogTitle>
      </DialogHeader>
      <form @submit.prevent="submitForm" class="flex flex-col gap-4 mt-2">
        <label class="flex flex-col gap-1">
          <span class="font-medium">Job ID</span>
          <Input v-model="form.id" placeholder="Job ID" :required="!job" :readonly="!!job" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-medium">Next Run Time (ISO)</span>
          <Input v-model="form.next_run_time" placeholder="YYYY-MM-DDTHH:mm:ssZ" required />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-medium">Job State (JSON)</span>
          <textarea
            v-model="form.job_state"
            class="border rounded p-2 text-xs font-mono"
            rows="4"
            required
          />
        </label>
        <div class="flex justify-end gap-2 mt-2">
          <Button type="button" variant="outline" @click="$emit('close')">Cancel</Button>
          <Button type="submit">{{ job ? 'Save Changes' : 'Create Job' }}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import { ref, watch } from 'vue'
import { createDjangoJob, updateDjangoJob } from '@/services/django-jobs-service'

/**

 * @deprecated Use generated types from src/api/generated instead

 * This interface will be removed after migration to openapi-zod-client generated types

 */

interface DjangoJobForm {
  id: string
  next_run_time: string
  job_state: string
}

/**

 * @deprecated Use generated types from src/api/generated instead

 * This interface will be removed after migration to openapi-zod-client generated types

 */

interface DjangoJob {
  id: string
  next_run_time: string | null
  job_state: string
}

const props = defineProps<{ job: DjangoJob | null }>()
const emit = defineEmits(['close', 'saved'])

const form = ref<DjangoJobForm>({
  id: '',
  next_run_time: '',
  job_state: '',
})

watch(
  () => props.job,
  (job: DjangoJob | null) => {
    if (job) {
      form.value = {
        id: job.id,
        next_run_time: job.next_run_time || '',
        job_state: job.job_state,
      }
    } else {
      form.value = { id: '', next_run_time: '', job_state: '' }
    }
  },
  { immediate: true },
)

async function submitForm() {
  if (props.job) {
    await updateDjangoJob(props.job.id, {
      next_run_time: form.value.next_run_time,
      job_state: form.value.job_state,
    })
  } else {
    await createDjangoJob(form.value)
  }
  emit('saved')
}
</script>

<style scoped>
textarea {
  resize: vertical;
}
</style>
