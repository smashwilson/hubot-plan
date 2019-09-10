const {createBuilderClass} = require("nested-builder");

// https://developers.google.com/calendar/v3/reference/acl

export const ScopeBuilder = createBuilderClass()({
  type: {default: "default"},
  value: {default: undefined},
});

export const AclRuleFactory = createBuilderClass()({
  kind: {default: "calendar#aclRule"},
  id: {default: "id"},
  etag: {default: "etag"},
  scope: {nested: ScopeBuilder},
  role: {default: "writer"},
});
