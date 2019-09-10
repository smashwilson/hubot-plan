const {createBuilderClass} = require("nested-builder");

// https://developers.google.com/calendar/v3/reference/events

export const UserBuilder = createBuilderClass()({
  id: {default: "id"},
  email: {default: "who@example.com"},
  displayName: {default: "Display Name"},
  self: {default: false},
});

export const TimestampBuilder = createBuilderClass()({
  date: {default: "2019-09-30"},
  dateTime: {default: "2019-09-30T13:22:53.108Z"},
  timeZone: {default: "Europe/Zurich"},
});

export const AttendeeBuilder = createBuilderClass()({
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

export const ExtendedPropertiesBuilder = createBuilderClass()({
  private: {default: {}},
  shared: {default: {}},
});

export const ReminderOverrideBuilder = createBuilderClass()({
  method: {default: "email"},
  minutes: {default: 5},
});

export const ReminderBuilder = createBuilderClass()({
  useDefault: {default: false},
  overrides: {plural: true, nested: ReminderOverrideBuilder, default: []},
});

export const EventFactory = createBuilderClass()({
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
  creator: {nested: UserBuilder},
  organizer: {nested: UserBuilder},
  start: {nested: TimestampBuilder},
  end: {nested: TimestampBuilder},
  endTimeUnspecified: {default: false},
  recurrence: {plural: true, default: []},
  recurringEventId: {default: undefined},
  originalStartTime: {nested: TimestampBuilder},
  transparency: {default: "opaque"},
  visibility: {default: "default"},
  iCalUID: {default: "icaluid"},
  sequence: {default: 0},
  attendees: {plural: true, default: [], nested: AttendeeBuilder},
  attendeesOmitted: {default: undefined},
  extendedProperties: {nested: ExtendedPropertiesBuilder},
  anyoneCanAddSelf: {default: false},
  guestsCanInviteOthers: {default: true},
  guestsCanModify: {default: false},
  privateCopy: {default: false},
  locked: {default: false},
  reminders: {nested: ReminderBuilder},
});

// Intentionally omitted: conferenceData, hangoutLink, source, attachments
