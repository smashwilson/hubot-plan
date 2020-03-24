/* eslint-env mocha */

const assert = require("chai").assert;
const {ts} = require("./bot-context");

const {Event} = require("../lib/event");
const {EventSet} = require("../lib/event-set");
const {Invitee} = require("../lib/invitee");
const {ICalPresenter} = require("../lib/ical-presenter");

describe("ICalPresenter", function () {
  let evt;

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
        U0: "user0@gmail.com",
        U1: "user1@gmail.com",
        U2: "user2@gmail.com",
      }[uid];
    },
  };

  beforeEach(function () {
    evt = new Event("AAA111", "Video Games");

    evt.invite(u.zero);
    evt.invite(u.one);
    evt.invite(u.two);

    evt.proposeDate(ts.tomorrow);
    evt.proposeDate(ts.nextWeek);
    evt.proposeDate(ts.nextMonth);

    evt.acceptProposal(u.zero, 0);
    evt.acceptProposal(u.zero, 1);

    evt.acceptProposal(u.one, 1);
    evt.acceptProposal(u.one, 2);
  });

  describe("with an unfinalized event", function () {
    it('renders each proposed date as "tentative"', function () {
      const p = new ICalPresenter({});
      const ical = p.present(evt);

      assert.match(ical, /^SUMMARY:Video Games$/m);
      assert.match(ical, /^STATUS:TENTATIVE$/m);
      assert.match(ical, /^TRANSP:TRANSPARENT$/m);

      assert.match(ical, /^DTSTART;VALUE=DATE:20171119$/m);
      assert.match(ical, /^DTSTART;VALUE=DATE:20171125$/m);
      assert.match(ical, /^DTSTART;VALUE=DATE:20171216$/m);
    });

    it("includes the attendees from each proposed date", function () {
      const p = new ICalPresenter({userSource});
      const ical = p.present(evt);

      assert.lengthOf(
        ical.match(
          /^ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=user0:MAILTO:user0@gmail\.com$/gm
        ),
        2
      );
      assert.lengthOf(
        ical.match(
          /^ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=DECLINED;CN=user0:MAILTO:user0@gmail\.com$/gm
        ),
        1
      );

      assert.lengthOf(
        ical.match(
          /^ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=user1:MAILTO:user1@gmail\.com$/gm
        ),
        2
      );
      assert.lengthOf(
        ical.match(
          /^ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=DECLINED;CN=user1:MAILTO:user1@gmail\.com$/gm
        ),
        1
      );

      assert.isNull(ical.match(/CN=user2/gm));
    });
  });

  describe("with a finalized event", function () {
    beforeEach(function () {
      evt.finalize(0);
    });

    it('renders at the chosen date as "confirmed"', function () {
      const p = new ICalPresenter({});
      const ical = p.present(evt);

      assert.match(ical, /^SUMMARY:Video Games$/m);
      assert.match(ical, /^STATUS:CONFIRMED$/m);
      assert.match(ical, /^TRANSP:OPAQUE$/m);
    });

    it("includes attendees", function () {
      const p = new ICalPresenter({userSource});
      const ical = p.present(evt);

      assert.match(
        ical,
        /^ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=user0:MAILTO:user0@gmail\.com$/m
      );
      assert.match(
        ical,
        /^ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=DECLINED;CN=user1:MAILTO:user1@gmail\.com$/m
      );
    });
  });

  describe("with an EventSet", function () {
    let evt0, evt1, evt2, set;

    beforeEach(function () {
      evt0 = new Event("AAA000", "Zero");
      evt0.proposeDate(ts.tomorrow);
      evt0.invite(u.zero);
      evt0.invite(u.one);

      evt1 = new Event("BBB111", "One");
      evt1.proposeDate(ts.nextWeek);
      evt1.proposeDate(ts.nextMonth);
      evt1.invite(u.zero);
      evt1.invite(u.one);

      evt2 = new Event("CCC222", "Two");
      evt2.proposeDate(ts.nextMonth);
      evt2.proposeDate(ts.nextYear);
      evt2.finalize(0);
      evt2.invite(u.zero);
      evt2.invite(u.one);

      set = new EventSet(null, [evt0, evt1, evt2]);
    });

    it("renders all events to a single feed", function () {
      const p = new ICalPresenter({userSource});
      const ical = p.present(set);

      assert.match(ical, /^SUMMARY:Zero$/m);
      assert.match(ical, /^SUMMARY:One$/m);
      assert.match(ical, /^SUMMARY:Two$/m);
    });

    it("includes the calendar name", function () {
      const p = new ICalPresenter({userSource, calendarName: "Stuff"});
      const ical = p.present(set);

      assert.match(ical, /^X-WR-CALNAME:Stuff$/m);
    });
  });
});
