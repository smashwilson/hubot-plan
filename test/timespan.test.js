/* eslint-env mocha */

const {Timespan} = require("../lib/timespan");
const assert = require("chai").assert;
const moment = require("moment-timezone");

const TZ = "America/Los_Angeles";

describe("Timespan", function() {
  describe("parsing", function() {
    it("parses a single day as a full-day span", function() {
      const t = Timespan.parse("2017-11-17", TZ);

      assert.isTrue(t.isFullDay());
      assert.isTrue(t.getStart().isSame(moment.tz("2017-11-17 00:00:00", TZ)));
      assert.isTrue(
        t.getEnd().isSame(moment.tz("2017-11-17 23:59:59.999", TZ))
      );
    });

    it("parses a range of full days", function() {
      const t = Timespan.parse("2017-11-17..2017-11-19", TZ);

      assert.isTrue(t.isFullDay());
      assert.isTrue(t.getStart().isSame(moment.tz("2017-11-17 00:00:00", TZ)));
      assert.isTrue(
        t.getEnd().isSame(moment.tz("2017-11-19 23:59:59.999", TZ))
      );
    });

    it("parses a full day plus a duration in days", function() {
      const t = Timespan.parse("2017-11-17+2d", TZ);

      assert.isTrue(t.isFullDay());
      assert.isTrue(t.getStart().isSame(moment.tz("2017-11-17 00:00:00", TZ)));
      assert.isTrue(
        t.getEnd().isSame(moment.tz("2017-11-19 23:59:59.999", TZ))
      );
    });

    it("parses a single time as an hour-long span", function() {
      const t = Timespan.parse("2017-11-17 16:00", TZ);

      assert.isFalse(t.isFullDay());
      assert.isTrue(t.getStart().isSame(moment.tz("2017-11-17 16:00:00", TZ)));
      assert.isTrue(t.getEnd().isSame(moment.tz("2017-11-17 17:00:00", TZ)));
    });

    it("parses a range of times", function() {
      const t = Timespan.parse("2017-11-17 16:00..2017-11-17 18:00", TZ);

      assert.isFalse(t.isFullDay());
      assert.isTrue(t.getStart().isSame(moment.tz("2017-11-17 16:00:00", TZ)));
      assert.isTrue(t.getEnd().isSame(moment.tz("2017-11-17 18:00:00", TZ)));
    });

    it("parses a single time and a duration", function() {
      const t = Timespan.parse("2017-11-17 14:00+2h30m", TZ);

      assert.isFalse(t.isFullDay());
      assert.isTrue(t.getStart().isSame(moment.tz("2017-11-17 14:00:00", TZ)));
      assert.isTrue(t.getEnd().isSame(moment.tz("2017-11-17 16:30:00", TZ)));
    });

    it("parses a day and a time", function() {
      const t = Timespan.parse("2017-11-17..2017-11-18 11:00", TZ);

      assert.isFalse(t.isFullDay());
      assert.isTrue(t.getStart().isSame(moment.tz("2017-11-17 00:00:00", TZ)));
      assert.isTrue(t.getEnd().isSame(moment.tz("2017-11-18 11:00:00", TZ)));
    });

    it("parses a day and a sub-day duration", function() {
      const t = Timespan.parse("2017-11-17+2h", TZ);

      assert.isFalse(t.isFullDay());
      assert.isTrue(t.getStart().isSame(moment.tz("2017-11-17 00:00:00", TZ)));
      assert.isTrue(t.getEnd().isSame(moment.tz("2017-11-17 02:00:00", TZ)));
    });

    it("becomes invalid on an invalid time", function() {
      assert.isFalse(Timespan.parse("2017-33-76", TZ).isValid());
    });

    it("becomes invalid on an invalid duration", function() {
      assert.isFalse(Timespan.parse("2017-11-17 11:00+2x", TZ).isValid());
    });
  });

  describe("serialization", function() {
    it("round-trips itself through a JSON-able representation", function() {
      const ts = Timespan.parse("2017-11-17 11:00:00..2017-11-17 13:00:00", TZ);
      const o = ts.serialize();
      const i = JSON.parse(JSON.stringify(o));
      const result = Timespan.deserialize(i);

      assert.isFalse(result.isFullDay());
      assert.isTrue(
        result.getStart().isSame(moment.tz("2017-11-17 11:00:00", TZ))
      );
      assert.isTrue(
        result.getEnd().isSame(moment.tz("2017-11-17 13:00:00", TZ))
      );
    });
  });

  describe("printing", function() {
    it("prints a full-day span as a Slack timestamp", function() {
      const ts = Timespan.parse("2017-11-17", TZ);

      assert.equal(
        ts.renderStart(),
        "<!date^1510905600^{date}|17 November 2017>"
      );
      assert.equal(
        ts.renderRange(),
        "<!date^1510905600^{date}|17 November 2017>"
      );
    });

    it("prints a multi-day span as a Slack timestamp", function() {
      const ts = Timespan.parse("2017-11-17..2017-11-19", TZ);

      assert.equal(
        ts.renderStart(),
        "<!date^1510905600^{date}|17 November 2017>"
      );
      assert.equal(
        ts.renderRange(),
        "<!date^1510905600^{date}|17 November 2017> to <!date^1511164799^{date}|19 November 2017>"
      );
    });

    it("prints a timestamp as a Slack timestamp", function() {
      const ts = Timespan.parse("2017-11-17 11:30", TZ);

      assert.equal(
        ts.renderStart(),
        "<!date^1510947000^{date_short} {time}|17 Nov 2017 11:30am>"
      );
      assert.equal(
        ts.renderRange(),
        "<!date^1510947000^{date_short} {time}|17 Nov 2017 11:30am> to <!date^1510950600^{time}|12:30pm>"
      );
    });

    it("prints a multi-day timespan as a Slack timestamp", function() {
      const ts = Timespan.parse("2017-11-17 14:00..2017-11-18 06:00", TZ);

      assert.equal(
        ts.renderRange(),
        "<!date^1510956000^{date_short} {time}|17 Nov 2017 2:00pm> to " +
          "<!date^1511013600^{date_short} {time}|18 Nov 2017 6:00am>"
      );
    });
  });
});
