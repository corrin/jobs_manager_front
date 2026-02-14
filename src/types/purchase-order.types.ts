import { schemas } from '@/api/generated/api'
import type { z } from 'zod'

export type BackendPurchaseOrderStatus = z.infer<typeof schemas.PurchaseOrderDetailStatusEnum>
export type UiPurchaseOrderStatus = BackendPurchaseOrderStatus | 'local_draft'
export type PurchaseOrderDetail = z.infer<typeof schemas.PurchaseOrderDetail>
export type PurchaseOrderWithUiStatus = Omit<PurchaseOrderDetail, 'status'> & {
  status?: UiPurchaseOrderStatus
}
