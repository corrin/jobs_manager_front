declare module '@kodeglot/vue-calendar' {
  const CalendarView: any
  const useCalendarStore: any
  export type CalendarEvent = Record<string, unknown>

  export { CalendarView, useCalendarStore }
  export default CalendarView
}
