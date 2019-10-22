/* eslint-env mocha */

const {assert} = require("chai");

const {EmailStore} = require("../lib/email-store");
const {BotContext} = require("./bot-context");

describe("EmailStore", function() {
  let store, bot;

  beforeEach(function() {
    bot = new BotContext();
    bot.createUser("u0", "user0", "user0+slack@gmail.com");
    bot.createUser("u1", "user1", null);

    store = new EmailStore(bot.room.robot);
  });

  afterEach(function() {
    bot.cleanup();
  });

  it("defaults to the email provided by the Slack API", function() {
    assert.deepEqual(store.known("u0"), ["user0+slack@gmail.com"]);
    assert.strictEqual(store.getDefault("u0"), "user0+slack@gmail.com");
    assert.strictEqual(store.getSlackProvided("u0"), "user0+slack@gmail.com");
  });

  it("gracefully handles if Slack does not provide an email", function() {
    assert.deepEqual(store.known("u1"), []);
    assert.isNull(store.getDefault("u1"));
    assert.isNull(store.getSlackProvided("u1"));
  });

  it("adds a first email and always sets it as the default", function() {
    store.add("u1", "user1+manual@gmail.com", false);
    assert.deepEqual(store.known("u1"), ["user1+manual@gmail.com"]);
    assert.strictEqual(store.getDefault("u1"), "user1+manual@gmail.com");
    assert.isNull(store.getSlackProvided("u1"));
  });

  it("adds an email and sets it as the default if you ask it to", function() {
    store.add("u0", "user0+manual0@gmail.com", false);
    store.add("u0", "user0+default@gmail.com", true);
    store.add("u0", "user0+manual1@gmail.com", false);

    assert.deepEqual(store.known("u0"), [
      "user0+slack@gmail.com",
      "user0+manual0@gmail.com",
      "user0+default@gmail.com",
      "user0+manual1@gmail.com",
    ]);
    assert.strictEqual(store.getDefault("u0"), "user0+default@gmail.com");
    assert.strictEqual(store.getSlackProvided("u0"), "user0+slack@gmail.com");
  });

  it("removes an email you haven't set", function() {
    store.add("u0", "user0+manual0@gmail.com", false);
    store.add("u0", "user0+default@gmail.com", true);
    store.add("u0", "user0+manual1@gmail.com", false);

    store.remove("u0", "nope@gmail.com");

    assert.deepEqual(store.known("u0"), [
      "user0+slack@gmail.com",
      "user0+manual0@gmail.com",
      "user0+default@gmail.com",
      "user0+manual1@gmail.com",
    ]);
    assert.strictEqual(store.getDefault("u0"), "user0+default@gmail.com");
    assert.strictEqual(store.getSlackProvided("u0"), "user0+slack@gmail.com");
  });

  it("removes a non-default email", function() {
    store.add("u0", "user0+manual0@gmail.com", false);
    store.add("u0", "user0+manual1@gmail.com", false);
    store.add("u0", "user0+default@gmail.com", true);

    store.remove("u0", "user0+manual0@gmail.com");

    assert.deepEqual(store.known("u0"), [
      "user0+slack@gmail.com",
      "user0+manual1@gmail.com",
      "user0+default@gmail.com",
    ]);
    assert.strictEqual(store.getDefault("u0"), "user0+default@gmail.com");
  });

  it("removes a default email with a Slack address to fall back to", function() {
    store.add("u0", "user0+manual0@gmail.com", false);
    store.add("u0", "user0+manual1@gmail.com", false);
    store.add("u0", "user0+default@gmail.com", true);

    assert.strictEqual(store.getDefault("u0"), "user0+default@gmail.com");

    store.remove("u0", "user0+default@gmail.com");

    assert.deepEqual(store.known("u0"), [
      "user0+slack@gmail.com",
      "user0+manual0@gmail.com",
      "user0+manual1@gmail.com",
    ]);
    assert.strictEqual(store.getDefault("u0"), "user0+slack@gmail.com");
  });

  it("removes a default email with exactly one other to fall back to", function() {
    store.add("u1", "user1+manual0@gmail.com", false);
    store.add("u1", "user1+default@gmail.com", true);

    assert.deepEqual(store.known("u1"), [
      "user1+manual0@gmail.com",
      "user1+default@gmail.com",
    ]);
    assert.strictEqual(store.getDefault("u1"), "user1+default@gmail.com");

    store.remove("u1", "user1+default@gmail.com");

    assert.deepEqual(store.known("u1"), ["user1+manual0@gmail.com"]);
    assert.strictEqual(store.getDefault("u1"), "user1+manual0@gmail.com");
  });

  it("fails to remove a default email without a clear fallback", function() {
    store.add("u1", "user1+manual0@gmail.com", false);
    store.add("u1", "user1+manual1@gmail.com", false);
    store.add("u1", "user1+default@gmail.com", true);

    assert.throws(() => store.remove("u1", "user1+default@gmail.com"));
  });

  it("fails to remove the Slack-provided email", function() {
    assert.throws(() => store.remove("u0", "user0+slack@gmail.com"));
  });

  it("serializes and deserializes itself", function() {
    store.add("u0", "user0+manual0@gmail.com", false);
    store.add("u0", "user0+default@gmail.com", true);
    store.add("u0", "user0+manual1@gmail.com", false);
    store.add("u1", "user1+manual@gmail.com", false);

    const payload = store.serialize();
    const t = JSON.parse(JSON.stringify(payload));

    const bot1 = new BotContext();
    bot1.createUser("u0", "user0", null);
    bot1.createUser("u1", "user1", "user1+slack@gmail.com");
    const store1 = EmailStore.deserialize(bot1.room.robot, t);

    assert.deepEqual(store1.known("u0"), [
      "user0+manual0@gmail.com",
      "user0+default@gmail.com",
      "user0+manual1@gmail.com",
    ]);
    assert.strictEqual(store1.getDefault("u0"), "user0+default@gmail.com");
    assert.isNull(store1.getSlackProvided("u0"));

    assert.deepEqual(store1.known("u1"), [
      "user1+slack@gmail.com",
      "user1+manual@gmail.com",
    ]);
    assert.strictEqual(store1.getDefault("u1"), "user1+manual@gmail.com");
    assert.strictEqual(store1.getSlackProvided("u1"), "user1+slack@gmail.com");
  });
});
