const {createFactory} = require("./factory");

// https://developers.google.com/calendar/v3/reference/acl

export const ScopeFactory = createFactory("Scope", {
  type: {default: "default"},
  value: {default: undefined},
});

export const AclRuleFactory = createFactory("AclRule", {
  kind: {default: "calendar#aclRule"},
  id: {default: "id"},
  etag: {default: "etag"},
  scope: {factory: ScopeFactory},
  role: {default: "writer"},
});
