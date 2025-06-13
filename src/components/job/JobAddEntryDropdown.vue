<script setup lang="ts">
import { ref, toRefs } from 'vue'; // Adicionado toRefs
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu/index';
import NewTaskModal from '@/components/job/task/NewTaskModal.vue';
import NewMaterialModal from '@/components/job/material/NewMaterialModal.vue'; // Importar o novo modal
import { PlusCircle, Clock, Package, Edit3 } from 'lucide-vue-next';

// Definir Props
interface Props {
  jobId: string;
  jobChargeOutRate: number;
  companyDefaults: any; // Use um tipo mais específico se disponível
  latestEstimatePricingId?: string;
}
const props = defineProps<Props>();

// Usar toRefs para manter a reatividade ao desestruturar props
const { jobId, jobChargeOutRate, companyDefaults, latestEstimatePricingId } = toRefs(props);

const isNewTaskModalOpen = ref(false);
const isNewMaterialModalOpen = ref(false); // Estado para o modal de material
// const isNewAdjustmentModalOpen = ref(false); // Para o futuro

const openNewTaskModal = () => {
  isNewTaskModalOpen.value = true;
};

const openNewMaterialModal = () => {
  isNewMaterialModalOpen.value = true; // Abrir o modal de material
};

const openNewAdjustmentModal = () => {
  // isNewAdjustmentModalOpen.value = true;
  alert('Add Adjustment functionality not yet implemented.');
};

// Handlers para os eventos 'save' dos modais
const handleTaskSaved = (taskData: any, addAnother: boolean) => {
  console.log('Task saved:', taskData, 'Add another:', addAnother);
  // Lógica de salvamento da tarefa (emitir para o pai ou chamar serviço)
  // Exemplo: emit('task-saved', taskData, addAnother);
  if (!addAnother) {
    isNewTaskModalOpen.value = false;
  }
};

const handleMaterialSaved = (materialData: any, addAnother: boolean) => {
  console.log('Material saved:', materialData, 'Add another:', addAnother);
  // Lógica de salvamento do material (emitir para o pai ou chamar serviço)
  // Exemplo: emit('material-saved', materialData, addAnother);
  if (!addAnother) {
    isNewMaterialModalOpen.value = false;
  }
};

// Se você precisar emitir eventos para o JobView.vue, defina-os aqui
// interface Emits {
//   (e: 'task-saved', taskData: any, addAnother: boolean): void;
//   (e: 'material-saved', materialData: any, addAnother: boolean): void;
// }
// const emit = defineEmits<Emits>();

</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" class="flex items-center">
          <PlusCircle class="mr-2 h-4 w-4" /> Add Entry
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-56">
        <DropdownMenuLabel>Add New Entry</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="openNewTaskModal">
          <Clock class="mr-2 h-4 w-4 text-blue-500" />
          <span>Add Time / Task</span>
        </DropdownMenuItem>
        <DropdownMenuItem @click="openNewMaterialModal"> <!-- Removido disabled -->
          <Package class="mr-2 h-4 w-4 text-green-500" />
          <span>Add Material</span>
        </DropdownMenuItem>
        <DropdownMenuItem @click="openNewAdjustmentModal" disabled>
          <Edit3 class="mr-2 h-4 w-4 text-purple-500" />
          <span>Add Adjustment</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Modal para Nova Tarefa -->
    <NewTaskModal
      v-model:open="isNewTaskModalOpen"
      :job-id="jobId"
      :job-charge-out-rate="jobChargeOutRate"
      :company-defaults="companyDefaults"
      :latest-estimate-pricing-id="latestEstimatePricingId"
      @save="handleTaskSaved"
    />

    <!-- Modal para Novo Material -->
    <NewMaterialModal
      v-model:open="isNewMaterialModalOpen"
      :job-id="jobId"
      :company-defaults="companyDefaults"
      :latest-estimate-pricing-id="latestEstimatePricingId"
      @save="handleMaterialSaved"
    />

    <!-- Modais para Ajuste (a serem implementados) -->
    <!--
    <NewAdjustmentModal v-model:open="isNewAdjustmentModalOpen" @save="handleAdjustmentSaved" />
    -->
  </div>
</template>

<style scoped>
/* Estilos adicionais se necessário */
</style>
