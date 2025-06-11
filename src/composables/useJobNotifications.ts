import { toast } from 'vue-sonner'

/**
 * Composable para notificações relacionadas a jobs
 * Centraliza todas as notificações para manter consistência
 * Usando vue-sonner que já está configurado no projeto
 */
export function useJobNotifications() {
  
  const notifyJobUpdated = (jobName: string) => {
    toast.success('Job atualizado', {
      description: `${jobName} foi atualizado com sucesso`
    })
  }

  const notifyJobLoaded = (jobName: string) => {
    console.log(`✅ Job ${jobName} carregado com sucesso`)
    // Não mostrar toast para carregamento para não poluir a interface
  }

  const notifyJobError = (jobId: string, error: string) => {
    toast.error('Erro no job', {
      description: `Erro ao carregar job ${jobId}: ${error}`
    })
  }

  const notifyFileUploaded = (fileName: string) => {
    toast.success('Arquivo enviado', {
      description: `${fileName} foi enviado com sucesso`
    })
  }

  const notifyFileDeleted = (fileName: string) => {
    toast.success('Arquivo removido', {
      description: `${fileName} foi removido com sucesso`
    })
  }

  const notifyQuoteCreated = () => {
    toast.success('Orçamento criado', {
      description: 'Orçamento foi criado e enviado com sucesso'
    })
  }

  const notifyQuoteAccepted = () => {
    toast.success('Orçamento aceito', {
      description: 'Orçamento foi aceito pelo cliente'
    })
  }

  const notifyInvoiceCreated = () => {
    toast.success('Fatura criada', {
      description: 'Fatura foi criada e enviada com sucesso'
    })
  }

  const notifyDataChanged = (dataType: string) => {
    toast.info('Dados alterados', {
      description: `${dataType} foi alterado - salvando automaticamente`
    })
  }

  const notifyEventAdded = (eventType: string) => {
    toast.success('Evento adicionado', {
      description: `Evento "${eventType}" foi adicionado com sucesso`
    })
  }

  const notifyPricingUpdated = () => {
    toast.info('Preços atualizados', {
      description: 'Dados de precificação foram atualizados automaticamente'
    })
  }

  return {
    notifyJobUpdated,
    notifyJobLoaded,
    notifyJobError,
    notifyFileUploaded,
    notifyFileDeleted,
    notifyQuoteCreated,
    notifyQuoteAccepted,
    notifyInvoiceCreated,
    notifyDataChanged,
    notifyEventAdded,
    notifyPricingUpdated,
  }
}
