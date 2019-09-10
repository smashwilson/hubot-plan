const {createBuilderClass} = require("nested-builder");

// https://developers.google.com/calendar/v3/reference/calendars

export const CalendarFactory = createBuilderClass()({
  kind: {default: "calendar#calendar"},
  etag: {default: "etag"},
  id: {default: "id"},
  summary: {default: "summary"},
  description: {default: "description"},
  location: {default: undefined},
  timeZone: {default: undefined},
  conferenceProperties: {default: {allowedConferenceSolutionTypes: []}},
});
