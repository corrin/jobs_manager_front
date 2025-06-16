// AG Grid Configuration
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule])

// Create custom theme with company colors (seguindo SRP - responsabilidade única para configuração de tema)
export const customTheme = themeQuartz.withParams({
  accentColor: '#4361EE',
  backgroundColor: '#FFFFFF',
  foregroundColor: '#1F2937',
  borderColor: 'rgba(0, 0, 0, 0.1)',
  headerBackgroundColor: 'rgba(67, 97, 238, 0.1)',
  oddRowBackgroundColor: 'rgba(0, 0, 0, 0.02)',
  spacing: 4
})

// Global AG Grid Configuration
export const defaultGridOptions = {
  // New Theming API (v33+)
  theme: customTheme,
  
  // Row Selection - updated API (v32.2+)
  rowSelection: {
    mode: 'singleRow',
    enableClickSelection: true
  },
  
  // Animation
  animateRows: true,
  
  // Column Sizing
  columnTypes: {
    dateColumn: {
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
          const dateAsString = cellValue;
          if (dateAsString == null) return -1;
          const dateParts = dateAsString.split('/');
          const cellDate = new Date(
            Number(dateParts[2]),
            Number(dateParts[1]) - 1,
            Number(dateParts[0])
          );
          if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
            return 0;
          }
          if (cellDate < filterLocalDateAtMidnight) {
            return -1;
          }
          if (cellDate > filterLocalDateAtMidnight) {
            return 1;
          }
          return 0;
        },
      },
    },
    numericColumn: {
      filter: 'agNumberColumnFilter',
      cellClass: 'numeric-cell',
    },
    currencyColumn: {
      filter: 'agNumberColumnFilter',
      cellClass: 'numeric-cell currency-cell',
      valueFormatter: (params: any) => {
        if (params.value == null) return '';
        return new Intl.NumberFormat('en-NZ', {
          style: 'currency',
          currency: 'NZD',
        }).format(params.value);
      },
    },
    hoursColumn: {
      filter: 'agNumberColumnFilter',
      cellClass: 'numeric-cell hours-cell',
      valueFormatter: (params: any) => {
        if (params.value == null) return '';
        return `${Number(params.value).toFixed(2)}h`;
      },
    },
  },
  
  // Default Column Definition
  defaultColDef: {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
    editable: false,
  },
  
  // Pagination
  pagination: false,
  
  // Row Height
  rowHeight: 50,
  headerHeight: 45,
  
  // Styling
  rowClass: 'timesheet-row',
  
  // Loading
  loadingOverlayComponent: null,
  noRowsOverlayComponent: null,
}

// Custom CSS Classes for Timesheet (updated for v33 Theming API)
export const timesheetGridClasses = {
  wrapper: 'timesheet-grid', // Removed ag-theme-quartz class
  container: 'h-full w-full',
}
