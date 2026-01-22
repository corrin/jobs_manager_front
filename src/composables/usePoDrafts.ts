import { v4 as uuidv4 } from 'uuid'
import { debugLog } from '@/utils/debug'
import type { z } from 'zod'
import { schemas } from '@/api/generated/api'

type PurchaseOrderCreate = z.infer<typeof schemas.PurchaseOrderCreate>

export type PoDraft = PurchaseOrderCreate & {
  draftId: string
  updatedAt: number
  label?: string
  supplier?: string
  po_number?: string
}

const STORAGE_KEY = 'po-drafts'

function getStorage(): PoDraft[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PoDraft[]
    return Array.isArray(parsed) ? parsed.filter((d) => d && d.draftId) : []
  } catch (err) {
    debugLog('Failed to parse PO drafts', err)
    return []
  }
}

function setStorage(drafts: PoDraft[]) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch (err) {
    debugLog('Failed to persist PO drafts', err)
  }
}

export function listPoDrafts(): PoDraft[] {
  return getStorage().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getPoDraft(draftId: string): PoDraft | null {
  return getStorage().find((d) => d.draftId === draftId) ?? null
}

export function savePoDraft(draft: Partial<PoDraft> & { draftId?: string }) {
  const drafts = getStorage()
  const now = Date.now()
  const nextDraft: PoDraft = {
    draftId: draft.draftId || uuidv4(),
    updatedAt: now,
    supplier_id: draft.supplier_id ?? null,
    supplier: draft.supplier ?? '',
    pickup_address_id: draft.pickup_address_id ?? null,
    reference: draft.reference ?? '',
    order_date: draft.order_date ?? null,
    expected_delivery: draft.expected_delivery ?? null,
    lines: draft.lines ?? [],
    po_number: draft.po_number ?? '',
    ...draft,
  }

  const existingIdx = drafts.findIndex((d) => d.draftId === nextDraft.draftId)
  if (existingIdx >= 0) {
    drafts[existingIdx] = nextDraft
  } else {
    drafts.push(nextDraft)
  }

  setStorage(drafts)
  return nextDraft.draftId
}

export function deletePoDraft(draftId: string) {
  const drafts = getStorage().filter((d) => d.draftId !== draftId)
  setStorage(drafts)
}

export function clearPoDrafts() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
