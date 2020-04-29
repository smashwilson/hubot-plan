/* eslint-env mocha */

const {BotContext} = require("./bot-context");
const assert = require("chai").assert;

describe("event delete", function () {
  let bot;

  beforeEach(async function () {
    bot = new BotContext();

    await bot.withStore((store) => {
      store.getEventStore().create("AAA111", "Something Cool");
    });
  });

  afterEach(function () {
    bot.cleanup();
  });

  it("deletes an existing event", async function () {
    await bot.say("me", "hubot: event delete AAA111");
    assert.equal(bot.response(), 'Event "Something Cool" has been deleted.');
    await bot.withStore((store) => {
      assert.throws(() => store.getEventStore().lookup("AAA111"), /Invalid event ID/);
    });
  });

  it("notes when a deleted event does not exist", async function () {
    await bot.say("me", "hubot: event delete OHNO");
    assert.equal(
      bot.response(),
      ":rotating_light: There is no event with the ID OHNO."
    );
  });
});
