import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Jobs Manager Training Manual',
  description: 'How to do your job - a cookbook for staff',

  // Output directory (relative to manual/ folder)
  outDir: '../dist-manual',

  themeConfig: {
    nav: [{ text: 'Home', link: '/' }],

    sidebar: [
      {
        text: 'Customer Contact',
        items: [{ text: 'New Customer Call', link: '/enquiries/new-customer-call' }],
      },
      {
        text: 'Quoting',
        items: [
          { text: 'Assess & Price a Job', link: '/quoting/assess-and-price' },
          { text: 'Send a Quote', link: '/quoting/send-quote' },
        ],
      },
      {
        text: 'Scheduling',
        items: [{ text: 'Schedule a Job', link: '/scheduling/schedule-a-job' }],
      },
      {
        text: 'Fieldwork',
        items: [{ text: 'Complete a Job On-Site', link: '/fieldwork/complete-a-job' }],
      },
      {
        text: 'Timesheets',
        items: [{ text: 'End of Day Entry', link: '/timesheets/end-of-day-entry' }],
      },
      {
        text: 'Invoicing',
        items: [{ text: 'Invoice a Job', link: '/invoicing/invoice-a-job' }],
      },
      {
        text: 'Weekly Procedures',
        items: [{ text: 'Weekly Checklist', link: '/end-of-week/weekly-checklist' }],
      },
      {
        text: 'Management',
        items: [{ text: 'Run Reports', link: '/management/run-reports' }],
      },
    ],

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },

  lastUpdated: true,
})
