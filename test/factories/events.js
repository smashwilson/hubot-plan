const {createFactory} = require("./factory");

// https://developers.google.com/calendar/v3/reference/events

export const UserFactory = createFactory("User", {
  id: {default: "id"},
  email: {default: "who@example.com"},
  displayName: {default: "Display Name"},
  self: {default: false},
});

export const TimestampFactory = createFactory("Timestamp", {
  date: {default: "2019-09-30"},
  dateTime: {default: "2019-09-30T13:22:53.108Z"},
  timeZone: {default: "Europe/Zurich"},
});

export const AttendeeFactory = createFactory("Attendee", {
  id: {default: "id"},
  email: {default: "who@example.com"},
  displayName: {default: "Display Name"},
  organizer: {default: false},
  self: {default: false},
  resource: {default: false},
  optional: {default: false},
  responseStatus: {default: "needsAction"},
  comment: {default: undefined},
  additionalGuests: {default: undefined},
});

export const ExtendedPropertiesFactory = createFactory("ExtendedProperties", {
  private: {default: {}},
  shared: {default: {}},
});

export const ReminderOverrideFactory = createFactory("ReminderOverride", {
  method: {default: "email"},
  minutes: {default: 5},
});

export const ReminderFactory = createFactory("Reminder", {
  useDefault: {default: false},
  overrides: {plural: true, factory: ReminderOverrideFactory, default: []},
});

export const EventFactory = createFactory("Event", {
  kind: {default: "calendar#event"},
  etag: {default: "etag"},
  id: {default: "id"},
  status: {default: "confirmed"},
  htmlLink: {default: "http://calendar.google.com/"},
  created: {default: "2019-09-30T13:22:53.108Z"},
  updated: {default: "2019-09-30T13:22:53.108Z"},
  summary: {default: "Summary"},
  description: {default: "Description"},
  location: {default: undefined},
  colorId: {default: undefined},
  creator: {factory: UserFactory},
  organizer: {factory: UserFactory},
  start: {factory: TimestampFactory},
  end: {factory: TimestampFactory},
  endTimeUnspecified: {default: false},
  recurrence: {plural: true, default: []},
  recurringEventId: {default: undefined},
  originalStartTime: {factory: TimestampFactory},
  transparency: {default: "opaque"},
  visibility: {default: "default"},
  iCalUID: {default: "icaluid"},
  sequence: {default: 0},
  attendees: {plural: true, default: [], factory: AttendeeFactory},
  attendeesOmitted: {default: undefined},
  extendedProperties: {factory: ExtendedPropertiesFactory},
  anyoneCanAddSelf: {default: false},
  guestsCanInviteOthers: {default: true},
  guestsCanModify: {default: false},
  privateCopy: {default: false},
  locked: {default: false},
  reminders: {factory: ReminderFactory},
});

// Intentionally omitted: conferenceData, hangoutLink, source, attachments
