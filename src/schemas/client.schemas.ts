/**
 * Client Schemas - Zod validation and type inference
 * 
 * Seguindo as diretrizes do projeto para usar Zod para validação
 * e inferência de tipos no frontend.
 */

import { z } from 'zod'

// Schema para criação de cliente
export const createClientSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .trim(),
  
  email: z.string()
    .email('Email deve ter formato válido')
    .max(254, 'Email deve ter no máximo 254 caracteres')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .max(500, 'Endereço deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  
  is_account_customer: z.boolean()
    .default(false)
})

// Schema para dados do cliente retornado pela API
export const clientResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  is_account_customer: z.boolean(),
  xero_contact_id: z.string(),
})

// Schema para resposta de criação de cliente
export const createClientResponseSchema = z.object({
  success: z.boolean(),
  client: clientResponseSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

// Tipos inferidos dos schemas
export type CreateClientData = z.infer<typeof createClientSchema>
export type ClientResponseData = z.infer<typeof clientResponseSchema>
export type CreateClientResponse = z.infer<typeof createClientResponseSchema>

// Schema para validação de form state
export const clientFormStateSchema = createClientSchema.extend({
  // Adicionar campos específicos do formulário se necessário
})

export type ClientFormState = z.infer<typeof clientFormStateSchema>
