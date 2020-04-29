const {EventStore} = require("./event-store");
const {EmailStore} = require("./email-store");
const {buildUnrecognizedStoreVersionError} = require("./errors");

const EVENT_STORE = Symbol("event-store");
const EMAIL_STORE = Symbol("email-store");

class Store {
  constructor(robot, stores = {}) {
    this.eventStore = stores[EVENT_STORE] || new EventStore(robot);
    this.emailStore = stores[EMAIL_STORE] || new EmailStore(robot);
  }

  getEventStore() {
    return this.eventStore;
  }

  getEmailStore() {
    return this.emailStore;
  }

  serialize() {
    return {
      version: "2",
      eventStore: this.eventStore.serialize(),
      emailStore: this.emailStore.serialize(),
    };
  }

  static deserialize(robot, payload) {
    if (payload.version === "2") {
      return new this(robot, {
        EVENT_STORE: EventStore.deserialize(robot, payload.eventStore),
        EMAIL_STORE: EmailStore.deserialize(robot, payload.emailStore),
      });
    } else if (payload.version === undefined) {
      // Version 1: only EventStore data
      return new this(robot, {
        EVENT_STORE: EventStore.deserialize(robot, payload),
      });
    } else {
      throw buildUnrecognizedStoreVersionError({version: payload.version});
    }
  }
}

module.exports = {Store};
