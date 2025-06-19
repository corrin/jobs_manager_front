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

  // Quote Link & Refresh notifications
  const notifyQuoteLinkStart = () => {
    toast.loading('Vinculando planilha...', {
      description: 'Criando e configurando planilha do orçamento',
      id: 'quote-link'
    })
  }

  const notifyQuoteLinkSuccess = (sheetUrl?: string) => {
    toast.success('Planilha vinculada com sucesso!', {
      description: sheetUrl ? 'A planilha foi criada e já pode ser acessada' : 'Planilha do orçamento foi vinculada',
      id: 'quote-link',
      action: sheetUrl ? {
        label: 'Abrir Planilha',
        onClick: () => window.open(sheetUrl, '_blank')
      } : undefined
    })
  }

  const notifyQuoteLinkError = (error: string) => {
    toast.error('Erro ao vincular planilha', {
      description: error,
      id: 'quote-link'
    })
  }

  const notifyQuoteRefreshStart = () => {
    toast.loading('Buscando atualizações...', {
      description: 'Verificando mudanças na planilha',
      id: 'quote-refresh'
    })
  }

  const notifyQuoteRefreshSuccess = (changesCount: number = 0) => {
    if (changesCount > 0) {
      toast.success('Orçamento atualizado!', {
        description: `${changesCount} alterações foram aplicadas`,
        id: 'quote-refresh'
      })
    } else {
      toast.info('Nenhuma alteração encontrada', {
        description: 'A planilha está sincronizada com o sistema',
        id: 'quote-refresh'
      })
    }
  }

  const notifyQuoteRefreshError = (error: string) => {
    toast.error('Erro ao atualizar orçamento', {
      description: error,
      id: 'quote-refresh'
    })
  }

  // Save notifications
  const notifySaveStart = (dataType: string = 'dados') => {
    toast.loading(`Salvando ${dataType}...`, {
      id: 'save-data'
    })
  }

  const notifySaveSuccess = (dataType: string = 'dados') => {
    toast.success(`${dataType} salvos!`, {
      description: 'Todas as alterações foram salvas',
      id: 'save-data'
    })
  }

  const notifySaveError = (error: string, dataType: string = 'dados') => {
    toast.error(`Erro ao salvar ${dataType}`, {
      description: error,
      id: 'save-data'
    })
  }

  // Delete notifications
  const notifyDeleteStart = (itemType: string) => {
    toast.loading(`Excluindo ${itemType}...`, {
      id: 'delete-item'
    })
  }

  const notifyDeleteSuccess = (itemType: string) => {
    toast.success(`${itemType} excluído!`, {
      description: 'Item foi removido permanentemente',
      id: 'delete-item'
    })
  }

  const notifyDeleteError = (error: string, itemType: string) => {
    toast.error(`Erro ao excluir ${itemType}`, {
      description: error,
      id: 'delete-item'
    })
  }

  // General API notifications
  const notifyApiError = (operation: string, error: string) => {
    toast.error(`Erro na operação: ${operation}`, {
      description: error
    })
  }

  const notifyApiSuccess = (operation: string, description?: string) => {
    toast.success(`${operation} concluída!`, {
      description: description || 'Operação realizada com sucesso'
    })
  }

  // Loading notifications with dismiss capability
  const showLoadingToast = (message: string, description?: string, id?: string) => {
    return toast.loading(message, {
      description,
      id: id || 'loading'
    })
  }

  const dismissToast = (id: string) => {
    toast.dismiss(id)
  }

  return {
    // Existing notifications
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
    
    // New Quote Link & Refresh notifications
    notifyQuoteLinkStart,
    notifyQuoteLinkSuccess,
    notifyQuoteLinkError,
    notifyQuoteRefreshStart,
    notifyQuoteRefreshSuccess,
    notifyQuoteRefreshError,
    
    // Save notifications
    notifySaveStart,
    notifySaveSuccess,
    notifySaveError,
    
    // Delete notifications
    notifyDeleteStart,
    notifyDeleteSuccess,
    notifyDeleteError,
    
    // General API notifications
    notifyApiError,
    notifyApiSuccess,
    
    // Utility functions
    showLoadingToast,
    dismissToast
  }
}
