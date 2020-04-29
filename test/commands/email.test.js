/* eslint-env mocha */

const {BotContext} = require("../bot-context");
const {assert} = require("chai");

describe("event email", function () {
  let bot;

  beforeEach(function () {
    bot = new BotContext();
    bot.createUser("u0", "user0", "user0+slack@gmail.com");
    bot.createUser("u1", "user1", null);
  });

  it("summarizes known, default, and Slack-provided email addresses", async function () {
    bot.withStore((store) => {
      const emailStore = store.getEmailStore();
      emailStore.add("u0", "user0+manual0@gmail.com", false);
      emailStore.add("u0", "user0+manual1@gmail.com", true);
    });

    await bot.say("u0", "hubot: event email");
    assert.strictEqual(
      bot.response(),
      ":slack: _user0+slack@gmail.com_, user0+manual0@gmail.com, :star: *user0+manual1@gmail.com*"
    );

    await bot.say("u1", "hubot: event email");
    assert.strictEqual(
      bot.response(),
      "I don't know any email addresses for you yet. Care to set one?\n```\nhubot: event email <address>\n```\n"
    );
  });

  it("associates a new email address", async function () {
    await bot.say("u0", "hubot: event email user0+added@gmail.com");
    assert.strictEqual(
      bot.response(),
      "Email address added.\n:slack: :star: _*user0+slack@gmail.com*_, user0+added@gmail.com"
    );
  });

  it("associates a new default email address", async function () {
    await bot.say(
      "u0",
      "hubot: event email --default user0+added@gmail.com"
    );
    assert.strictEqual(
      bot.response(),
      "Email address added and set as your default.\n:slack: _user0+slack@gmail.com_, :star: *user0+added@gmail.com*"
    );
  });

  it("removes an existing email address", async function () {
    bot.withStore((store) => {
      const emailStore = store.getEmailStore();
      emailStore.add("u0", "user0+manual0@gmail.com", false);
      emailStore.add("u0", "user0+manual1@gmail.com", true);
    });

    await bot.say(
      "u0",
      "hubot: event email --delete user0+manual0@gmail.com"
    );
    assert.strictEqual(
      bot.response(),
      "Email address *user0+manual0@gmail.com* removed.\n" +
        ":slack: _user0+slack@gmail.com_, :star: *user1+manual1@gmail.com*"
    );
  });
});
