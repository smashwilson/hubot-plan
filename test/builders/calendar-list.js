const {createBuilderClass} = require("nested-builder");

// https://developers.google.com/calendar/v3/reference/calendarList

const ReminderBuilder = createBuilderClass()({
  method: {default: "email"},
  minutes: {default: 10},
});

const NotificationBuilder = createBuilderClass()({
  type: {default: "eventCreation"},
  method: {default: "email"},
});

const CalendarListEntryBuilder = createBuilderClass()({
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
  defaultReminders: {plural: true, nested: ReminderBuilder, default: []},
  notificationSettings: {
    plural: true,
    factory: NotificationBuilder,
    default: [],
  },
  primary: {default: false},
  deleted: {default: false},
  conferenceProperties: {default: {allowedConferenceSolutionTypes: []}},
});

module.exports = {
  ReminderBuilder,
  NotificationBuilder,
  CalendarListEntryBuilder,
};
