#!/bin/bash
# track-migration-progress.sh
# Tracks migration progress by phase

echo "📊 Tracking numeric migration progress..."

# Define phase files
PHASE1_FILES=(
  "src/views/TimesheetEntryView.vue"
  "src/composables/useTimesheetEntryCalculations.ts"
  "src/composables/useTimesheetEntryGrid.ts"
  "src/services/weekly-timesheet.service.ts"
  "src/components/timesheet/TimesheetEntryJobCellEditor.ts"
)

PHASE2_FILES=(
  "src/components/job/JobEstimateTab.vue"
  "src/components/job/JobActualTab.vue"
  "src/components/job/CostSetSummaryCard.vue"
  "src/components/job/CostLinesGrid.vue"
  "src/views/JobCreateView.vue"
)

PHASE3_FILES=(
  "src/components/purchasing/PurchaseOrderForm.vue"
  "src/components/purchasing/PurchaseOrderLineItem.vue"
  "src/services/purchase-order.service.ts"
)

PHASE4_FILES=(
  "src/components/modals/JobFormModal.vue"
  "src/components/modals/CostLineModal.vue"
  "src/components/forms/TimesheetEntryForm.vue"
  "src/components/forms/JobForm.vue"
)

PHASE5_FILES=(
  "src/components/reports/JobProfitabilityReport.vue"
  "src/components/reports/TimesheetSummaryReport.vue"
  "src/lib/calculations.ts"
  "src/lib/formatters.ts"
)

# Function to check if file has conversions
check_file_conversions() {
  file=$1
  if [ -f "$file" ]; then
    count=$(grep -c "parseFloat(\|parseInt(\|Number(\|\.toString()" "$file" 2>/dev/null || echo "0")
    echo "$count"
  else
    echo "FILE_NOT_FOUND"
  fi
}

# Function to check phase progress
check_phase_progress() {
  phase_name=$1
  shift
  files=("$@")
  total=${#files[@]}
  completed=0
  
  echo "## $phase_name"
  echo "| File | Status | Conversions |"
  echo "|------|--------|-------------|"
  
  for file in "${files[@]}"; do
    conversions=$(check_file_conversions "$file")
    if [ "$conversions" = "FILE_NOT_FOUND" ]; then
      echo "| $file | ❓ Not Found | - |"
    elif [ "$conversions" = "0" ]; then
      echo "| $file | ✅ Complete | 0 |"
      completed=$((completed + 1))
    else
      echo "| $file | 🔄 In Progress | $conversions |"
    fi
  done
  
  echo ""
  echo "**Progress: $completed/$total files completed**"
  echo ""
}

# Generate progress report
{
  echo "# Migration Progress Report - $(date)"
  echo ""
  
  check_phase_progress "Phase 1: Critical Timesheet Components" "${PHASE1_FILES[@]}"
  check_phase_progress "Phase 2: Job Costing Components" "${PHASE2_FILES[@]}"
  check_phase_progress "Phase 3: Purchasing Components" "${PHASE3_FILES[@]}"
  check_phase_progress "Phase 4: Forms and Modals" "${PHASE4_FILES[@]}"
  check_phase_progress "Phase 5: Reports and Utilities" "${PHASE5_FILES[@]}"
  
  # Overall summary
  echo "## Overall Summary"
  total_conversions=$(grep -r "parseFloat(\|parseInt(\|Number(\|\.toString()" src/ --include="*.vue" --include="*.ts" | wc -l)
  echo "- Total remaining conversions: $total_conversions"
  echo "- Migration status: In Progress"
  echo ""
  
} > .kilocode/tasks/numeric-migration/progress-report-$(date +%Y%m%d).md

echo "✅ Progress report saved to .kilocode/tasks/numeric-migration/progress-report-$(date +%Y%m%d).md"