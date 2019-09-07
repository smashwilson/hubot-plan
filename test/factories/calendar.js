const {createFactory} = require("./factory");

// https://developers.google.com/calendar/v3/reference/calendars

export const CalendarFactory = createFactory("Calendar", {
  kind: {default: "calendar#calendar"},
  etag: {default: "etag"},
  id: {default: "id"},
  summary: {default: "summary"},
  description: {default: "description"},
  location: {default: undefined},
  timeZone: {default: undefined},
  conferenceProperties: {default: {allowedConferenceSolutionTypes: []}},
});
