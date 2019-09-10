const {createBuilderClass} = require("nested-builder");

// https://developers.google.com/calendar/v3/reference/calendarList

export const ReminderBuilder = createBuilderClass()({
  method: {default: "email"},
  minutes: {default: 10},
});

export const NotificationBuilder = createBuilderClass()({
  type: {default: "eventCreation"},
  method: {default: "email"},
});

export const CalendarListEntryBuilder = createBuilderClass()({
  kind: {default: "calendar#calendarListEntry"},
  etag: {default: "etag"},
  id: {default: "id"},
  summary: {default: "summary"},
  description: {default: "description"},
  location: {default: null},
  timeZone: {default: undefined},
  summaryOverride: {default: undefined},
  colorId: {default: null},
  backgroundColor: {default: undefined},
  foregroundColor: {default: undefined},
  hidden: {default: false},
  selected: {default: false},
  accessRole: {default: "owner"},
  defaultReminders: {plural: true, nested: ReminderFactory, default: []},
  notificationSettings: {
    plural: true,
    factory: NotificationFactory,
    default: [],
  },
  primary: {default: false},
  deleted: {default: false},
  conferenceProperties: {default: {allowedConferenceSolutionTypes: []}},
});
