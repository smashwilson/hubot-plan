/* eslint-env mocha */

const {BotContext, ts} = require("./bot-context");
const {Invitee} = require("../lib/invitee");
const assert = require("chai").assert;

describe("event list", function () {
  let bot;

  beforeEach(async function () {
    bot = new BotContext();
    bot.createUser("U0", "user0");
    bot.createUser("U1", "user1");
    bot.createUser("U2", "user2");

    await bot.withStore((store) => {
      const e0 = store.create("0", "A");
      e0.proposeDate(ts.lastWeek);
      e0.finalize(0);

      const e1 = store.create("1", "B boo");
      e1.proposeDate(ts.yesterday);

      const e2 = store.create("2", "C");
      e2.proposeDate(ts.now);
      e2.finalize(0);

      const e3 = store.create("3", "D");
      e3.proposeDate(ts.tomorrow);

      const e4 = store.create("4", "E boo");
      e4.proposeDate(ts.nextWeek);
      e4.proposeDate(ts.nextMonth);
      e4.invite(Invitee.withUID("U0"));

      const e5 = store.create("5", "F");
      e5.proposeDate(ts.nextYear);
      e5.finalize(0);

      const e6 = store.create("6", "G");
      e6.invite(Invitee.withUID("U1"));
    });
  });

  afterEach(function () {
    bot.cleanup();
  });

  it("defaults to showing events after today", async function () {
    await bot.say("user0", "hubot event list");
    assert.equal(
      bot.response(),
      "_Showing 5 of 7 events_\n" +
        "`6` _G_\n" +
        "`2` C <!date^1510992000^{date}|18 November 2017>\n" +
        "`3` _D_ <!date^1511078400^{date}|19 November 2017>\n" +
        "`4` _E boo_ <!date^1511596800^{date}|25 November 2017>, <!date^1513411200^{date}|16 December 2017>\n" +
        "`5` F <!date^1515571200^{date}|10 January 2018>"
    );
  });

  it("shows only events with matching names", async function () {
    await bot.say("user0", "hubot event list --name bO");
    assert.equal(
      bot.response(),
      "_Showing 2 of 7 events_\n" +
        "`1` _B boo_ <!date^1510905600^{date}|17 November 2017>\n" +
        "`4` _E boo_ <!date^1511596800^{date}|25 November 2017>, <!date^1513411200^{date}|16 December 2017>"
    );
  });

  it("shows only events before a timestamp", async function () {
    await bot.say("user0", "hubot event list --before 2017-11-25");
    assert.equal(
      bot.response(),
      "_Showing 6 of 7 events_\n" +
        "`6` _G_\n" +
        "`0` A <!date^1510300800^{date}|10 November 2017>\n" +
        "`1` _B boo_ <!date^1510905600^{date}|17 November 2017>\n" +
        "`2` C <!date^1510992000^{date}|18 November 2017>\n" +
        "`3` _D_ <!date^1511078400^{date}|19 November 2017>\n" +
        "`4` _E boo_ <!date^1511596800^{date}|25 November 2017>, <!date^1513411200^{date}|16 December 2017>"
    );
  });

  it('shows only events before "now"', async function () {
    await bot.say("user0", "hubot event list --before now");
    assert.equal(
      bot.response(),
      "_Showing 4 of 7 events_\n" +
        "`6` _G_\n" +
        "`0` A <!date^1510300800^{date}|10 November 2017>\n" +
        "`1` _B boo_ <!date^1510905600^{date}|17 November 2017>\n" +
        "`2` C <!date^1510992000^{date}|18 November 2017>"
    );
  });

  it("shows only events after a timestamp", async function () {
    await bot.say("user0", "hubot event list --after 2017-11-19");
    assert.equal(
      bot.response(),
      "_Showing 4 of 7 events_\n" +
        "`6` _G_\n" +
        "`3` _D_ <!date^1511078400^{date}|19 November 2017>\n" +
        "`4` _E boo_ <!date^1511596800^{date}|25 November 2017>, <!date^1513411200^{date}|16 December 2017>\n" +
        "`5` F <!date^1515571200^{date}|10 January 2018>"
    );
  });

  it('shows only events after "now"', async function () {
    await bot.say("user0", "hubot event list --after now");
    assert.equal(
      bot.response(),
      "_Showing 5 of 7 events_\n" +
        "`6` _G_\n" +
        "`2` C <!date^1510992000^{date}|18 November 2017>\n" +
        "`3` _D_ <!date^1511078400^{date}|19 November 2017>\n" +
        "`4` _E boo_ <!date^1511596800^{date}|25 November 2017>, <!date^1513411200^{date}|16 December 2017>\n" +
        "`5` F <!date^1515571200^{date}|10 January 2018>"
    );
  });

  it("shows only finalized events", async function () {
    await bot.say("user0", "hubot event list --finalized");
    assert.equal(
      bot.response(),
      "_Showing 3 of 7 events_\n" +
        "`0` A <!date^1510300800^{date}|10 November 2017>\n" +
        "`2` C <!date^1510992000^{date}|18 November 2017>\n" +
        "`5` F <!date^1515571200^{date}|10 January 2018>"
    );
  });

  it("shows only unfinalized events", async function () {
    await bot.say("user0", "hubot event list --unfinalized");
    assert.equal(
      bot.response(),
      "_Showing 4 of 7 events_\n" +
        "`6` _G_\n" +
        "`1` _B boo_ <!date^1510905600^{date}|17 November 2017>\n" +
        "`3` _D_ <!date^1511078400^{date}|19 November 2017>\n" +
        "`4` _E boo_ <!date^1511596800^{date}|25 November 2017>, <!date^1513411200^{date}|16 December 2017>"
    );
  });

  it("shows only events with a specified invitee", async function () {
    await bot.say("user0", "hubot event list --invited @user1");
    assert.equal(bot.response(), "_Showing 1 of 7 events_\n" + "`6` _G_");
  });

  it('shows only events when an invitee of "me"', async function () {
    await bot.say("user0", "hubot event list --invited me");
    assert.equal(
      bot.response(),
      "_Showing 1 of 7 events_\n" +
        "`4` _E boo_ <!date^1511596800^{date}|25 November 2017>, <!date^1513411200^{date}|16 December 2017>"
    );
  });

  it("shows all events", async function () {
    await bot.say("user0", "hubot event list --all");
    assert.equal(
      bot.response(),
      "_Showing 7 of 7 events_\n" +
        "`6` _G_\n" +
        "`0` A <!date^1510300800^{date}|10 November 2017>\n" +
        "`1` _B boo_ <!date^1510905600^{date}|17 November 2017>\n" +
        "`2` C <!date^1510992000^{date}|18 November 2017>\n" +
        "`3` _D_ <!date^1511078400^{date}|19 November 2017>\n" +
        "`4` _E boo_ <!date^1511596800^{date}|25 November 2017>, <!date^1513411200^{date}|16 December 2017>\n" +
        "`5` F <!date^1515571200^{date}|10 January 2018>"
    );
  });
});
