/* eslint-env mocha */

const assert = require("chai").assert;
const {ts} = require("./bot-context");

const {Event} = require("../lib/event");
const {Invitee} = require("../lib/invitee");
const {AttachmentPresenter} = require("../lib/attachment-presenter.js");

describe("AttachmentPresenter", function () {
  let event;

  const u = {
    zero: Invitee.withUID("U0"),
    one: Invitee.withUID("U1"),
    two: Invitee.withUID("U2"),
  };

  const userSource = {
    nameForID: (uid) => {
      return {
        U0: "user0",
        U1: "user1",
        U2: "user2",
      }[uid];
    },

    emailForID: (uid) => {
      return {
        U0: "user0@foo.com",
        U1: "user1@bar.com",
        U2: "user2@baz.com",
      }[uid];
    },
  };

  beforeEach(function () {
    event = new Event("ABC123", "Burrito Party");
  });

  describe("with an empty event", function () {
    it("shows the title and an empty proposed dates field", function () {
      const p = new AttachmentPresenter({userSource});
      const a = p.present(event);

      assert.equal(a.fallback, "ABC123: Burrito Party");
      assert.equal(a.title, "ABC123 :calendar: Burrito Party");
      assert.deepEqual(a.fields, [
        {title: "Proposed Dates", value: "_none yet_"},
      ]);
      assert.deepEqual(a.mrkdwn_in, ["fields"]);
    });
  });

  describe("with an unfinalized event", function () {
    beforeEach(function () {
      event.proposeDate(ts.tomorrow);
      event.proposeDate(ts.nextWeek);
    });

    it("lists proposed dates", function () {
      const p = new AttachmentPresenter({now: ts.now.getStart(), userSource});
      const a = p.present(event);

      assert.deepEqual(a.fields, [
        {
          title: "Proposed Dates",
          value:
            "[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n" +
            "[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_",
        },
      ]);
    });

    it("lists counts of attendees who have voted for each", function () {
      event.acceptProposal(u.zero, 0);
      event.acceptProposal(u.zero, 1);

      event.acceptProposal(u.one, 0);
      event.acceptProposal(u.one, 1);

      event.acceptProposal(u.two, 1);

      const p = new AttachmentPresenter({now: ts.now.getStart(), userSource});
      const a = p.present(event);

      assert.deepEqual(a.fields[0], {
        title: "Proposed Dates",
        value:
          "[0] <!date^1511078400^{date}|19 November 2017> _in a day_ x2\n" +
          "[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_ :medal: x3",
      });
    });

    it("lists invitees with response status", function () {
      event.invite(u.zero);
      event.invite(u.one);
      event.acceptProposal(u.one, 0);
      event.acceptProposal(u.two, 1);

      const p = new AttachmentPresenter({now: ts.now.getStart(), userSource});
      const a = p.present(event);

      assert.deepEqual(a.fields[1], {
        title: "Who",
        value:
          "_Responses_\n" +
          ":white_square: user0 | :white_square_button: user1 | " +
          ":white_square_button: user2",
      });
    });

    it("@-mentions users when requested", function () {
      event.invite(u.zero);
      event.invite(u.one);
      event.acceptProposal(u.one, 0);
      event.acceptProposal(u.two, 1);

      const p = new AttachmentPresenter({
        now: ts.now.getStart(),
        userSource,
        ping: true,
      });
      const a = p.present(event);

      assert.deepEqual(a.fields[1], {
        title: "Who",
        value:
          "_Responses_\n" +
          ":white_square: <@U0> | :white_square_button: <@U1> | " +
          ":white_square_button: <@U2>",
      });
    });
  });

  describe("with a finalized event", function () {
    beforeEach(function () {
      event.invite(u.zero);
      event.invite(u.one);
      event.invite(u.two);

      event.proposeDate(ts.tomorrow);
      event.proposeDate(ts.nextWeek);

      event.acceptProposal(u.one, 0);
      event.acceptProposal(u.one, 1);

      event.acceptProposal(u.two, 1);

      event.finalize(0);
    });

    it("shows the chosen event date", function () {
      const p = new AttachmentPresenter({now: ts.now.getStart(), userSource});
      const a = p.present(event);

      assert.deepEqual(a.fields[0], {
        title: "When",
        value: "<!date^1511078400^{date}|19 November 2017> _in a day_",
      });
    });

    it("lists invitees with their response status", function () {
      const p = new AttachmentPresenter({now: ts.now.getStart(), userSource});
      const a = p.present(event);

      assert.deepEqual(a.fields[1], {
        title: "Who",
        value:
          "_Attendees (1 confirmed)_\n" +
          ":grey_question: user0 | :white_check_mark: user1 | :red_circle: user2",
      });
    });

    it("@-mentions users when requested", function () {
      const p = new AttachmentPresenter({
        now: ts.now.getStart(),
        userSource,
        ping: true,
      });
      const a = p.present(event);

      assert.deepEqual(a.fields[1], {
        title: "Who",
        value:
          "_Attendees (1 confirmed)_\n" +
          ":grey_question: <@U0> | :white_check_mark: <@U1> | :red_circle: <@U2>",
      });
    });
  });
});
