const moment = require("moment-timezone");

function fullDay(m) {
  return !/H|h|k|m|s|S/.test(m.creationData().format);
}

function parseDuration(str) {
  if (!/^(\d+[wdmhs]\s*)+$/i.test(str)) return moment.duration(NaN);

  const units = {};

  const rx = /(\d+)([wdmhs])/gi;
  let match;
  while ((match = rx.exec(str)) !== null) {
    units[match[2]] = parseInt(match[1]);
  }

  return moment.duration(units);
}

class Timespan {
  constructor(start, end, full) {
    this.start = start;
    this.end = end;
    this.full = full;
  }

  isFullDay() {
    return this.full;
  }

  isValid() {
    return this.start.isValid() && this.end.isValid();
  }

  getStart() {
    return this.start;
  }

  getEnd() {
    return this.end;
  }

  serialize() {
    return {
      start: this.start.valueOf(),
      end: this.end.valueOf(),
      tz: this.start.tz(),
      full: this.full,
    };
  }

  renderStart() {
    if (this.isFullDay()) {
      return `<!date^${this.start.unix()}^{date}|${this.start.format(
        "D MMMM YYYY"
      )}>`;
    } else {
      return `<!date^${this.start.unix()}^{date_short} {time}|${this.start.format(
        "D MMM YYYY h:mma"
      )}>`;
    }
  }

  renderRange() {
    let str = this.renderStart();

    if (this.isFullDay()) {
      if (!this.end.isSame(this.start, "day")) {
        str += ` to <!date^${this.end.unix()}^{date}|${this.end.format(
          "D MMMM YYYY"
        )}>`;
      }
    } else {
      if (!this.end.isSame(this.start, "day")) {
        str += ` to <!date^${this.end.unix()}^{date_short} {time}|${this.end.format(
          "D MMM YYYY h:mma"
        )}>`;
      } else {
        str += ` to <!date^${this.end.unix()}^{time}|${this.end.format(
          "hh:mma"
        )}>`;
      }
    }

    return str;
  }

  static parse(str, tz) {
    const sep = /\.+|\+/.exec(str);
    if (!sep) {
      const start = moment.tz(str, moment.ISO_8601, true, tz);
      const full = fullDay(start);
      const end = full
        ? start.clone().endOf("day")
        : start.clone().add(1, "hours");
      return new Timespan(start, end, full);
    } else {
      const firstPart = str.substring(0, sep.index);
      const secondPart = str.substring(sep.index + sep[0].length);

      const start = moment.tz(firstPart, moment.ISO_8601, true, tz);
      if (sep[0] === "+") {
        const duration = parseDuration(secondPart);
        const end = duration.isValid()
          ? start.clone().add(duration)
          : moment.invalid();
        const full = fullDay(start) && Number.isInteger(duration.asDays());
        if (full) end.endOf("day");
        return new Timespan(start, end, full);
      } else {
        const end = moment.tz(secondPart, moment.ISO_8601, true, tz);
        const full = fullDay(start) && fullDay(end);
        if (full) end.endOf("day");
        return new Timespan(start, end, full);
      }
    }
  }

  static deserialize(payload) {
    return new Timespan(
      moment.tz(payload.start, payload.tz),
      moment.tz(payload.end, payload.tz),
      payload.full
    );
  }
}

module.exports = {Timespan};
