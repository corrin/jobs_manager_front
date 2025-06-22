# Plano de Resolução de Problemas de Linting

**Total de problemas: 44 erros** (Atualizado em 21/06/2025 - após correções do Bloco 18)

## Blocos concluídos recentemente

### Bloco 18: Substituição de tipos e remoção de variáveis não utilizadas ✅

- ✅ `src/composables/useFormValidation.ts` - Substituído `any` por tipos seguros
- ✅ `src/composables/useTimesheetEntryGrid.ts` - Substituído `any` por tipos seguros
- ✅ `src/plugins/ag-grid.ts` - Tipado com `ValueFormatterParams` do ag-grid
- ✅ `src/stores/auth.ts` - Substituído `any` por tipos seguros
- ✅ `src/views/components/MetricsModal.vue` - Corrigida duplicidade de chave e variável não usada
- ✅ `src/views/KanbanView.vue` - Removidas variáveis não utilizadas

---

## Pendências para os próximos blocos

- Corrigir nomes single-word em componentes UI (Avatar, Badge, Button, Calendar, Card, Checkbox, Dialog, Input, Label, Popover, Select, Sonner, Switch, Textarea) — regra já desabilitada, pode ser cache do lint
- Corrigir interface vazia em `app-layout.types.ts`
- Continuar substituindo tipos `any` nos arquivos:
  - `src/types/costing.types.ts` (linhas 12, 21)
  - `src/types/grid.types.ts` (linhas 34, 36, 37)
  - `src/types/index.ts` (linhas 104, 110)
  - `src/utils/dateUtils.ts` (linha 63)
  - `src/utils/error-handler.ts` (linha 27)
  - `src/views/JobCreateView.vue` (linhas 179, 185)
  - `src/views/JobView.vue` (linhas 629, 730)
  - `src/views/TimesheetEntryView.vue` (linhas 1017, 1130, 1150, 1153)
  - `src/views/KanbanView.vue` (params de funções do ag-grid, linhas 219, 255, 257)
- Corrigir expressões não usadas em `useStaffDragAndDrop.ts` (linhas 26, 40, 50, 155) e variável não usada (linha 131)

---

## Histórico de Blocos Resolvidos

- Blocos 1-8, 12-18: Remoção de variáveis/importações não utilizadas, substituição de `any` por tipos seguros, tipagem global, correção de mutação de props, ajustes em ag-grid, etc.

---

**Próximo passo:**

- Corrigir interface vazia em `app-layout.types.ts`
- Corrigir expressões não usadas em `useStaffDragAndDrop.ts`
- Continuar substituindo tipos `any` nos arquivos listados acima
