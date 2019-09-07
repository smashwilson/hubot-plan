const {createFactory} = require("./factory");

// https://developers.google.com/calendar/v3/reference/calendarList

export const ReminderFactory = createFactory("Reminder", {
  method: {default: "email"},
  minutes: {default: 10},
});

export const NotificationFactory = createFactory("Notification", {
  type: {default: "eventCreation"},
  method: {default: "email"},
});

export const CalendarListEntryFactory = createFactory("CalendarListEntry", {
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
  defaultReminders: {plural: true, factory: ReminderFactory, default: []},
  notificationSettings: {
    plural: true,
    factory: NotificationFactory,
    default: [],
  },
  primary: {default: false},
  deleted: {default: false},
  conferenceProperties: {default: {allowedConferenceSolutionTypes: []}},
});
