/* eslint-env mocha */

const {assert} = require("chai");
const {BotContext} = require("./bot-context");

const {Store} = require("../lib/store");

describe("Store", function() {
  let bot;

  beforeEach(function() {
    bot = new BotContext();
  });

  afterEach(function() {
    bot.cleanup();
  });

  it("accesses email and event stores", function() {
    const store = new Store(bot.getRobot());

    assert.strictEqual(store.getEventStore().robot, bot.getRobot());
    assert.strictEqual(store.getEmailStore().userSource.robot, bot.getRobot());
  });

  it("serializes and deserializes itself", function() {
    const store0 = new Store(bot.getRobot());

    store0.getEventStore().create("1A", "Event name");
    store0.getEmailStore().add("u0", "user0@gmail.com", true);

    const payload = store0.serialize();
    const t = JSON.parse(JSON.stringify(payload));
    const store1 = Store.deserialize(bot.getRobot(), t);

    assert.strictEqual(
      store1
        .getEventStore()
        .lookup("1A")
        .getName(),
      "Event name"
    );
    assert.strictEqual(
      store1.getEmailStore().getDefault("u0"),
      "user0@gmail.com"
    );
  });

  describe("old deserialization versions", function() {
    it("understands version 1");

    it("fails on an unrecognized version");
  });
});
