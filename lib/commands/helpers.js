const {Timespan} = require("../timespan");
const {Invitee} = require("../invitee");
const {AttachmentPresenter} = require("../attachment-presenter");

function plural(count, singular, plural = singular + "s") {
  if (count === 1) {
    return `${count} ${singular}`;
  } else {
    return `${count} ${plural}`;
  }
}

function toInvitee(context, identifier) {
  if (context.robot.brain.users()[identifier]) {
    return Invitee.withUID(identifier);
  }

  let trimmed = identifier.replace(/^@/g, "");
  if (trimmed === "me") trimmed = context.msg.message.user.name;
  const u = context.robot.brain.userForName(trimmed);

  return u ? Invitee.withUID(u.id) : Invitee.free(trimmed);
}

class RobotUserSource {
  constructor(robot) {
    this.robot = robot;
  }

  withUser(uid, callback) {
    const u = this.robot.brain.users()[uid];
    if (u) {
      return callback(u);
    } else {
      return undefined;
    }
  }

  nameForID(uid) {
    return this.withUser(uid, u => u.name);
  }

  emailForID(uid) {
    return this.withUser(uid, u => u.email_address);
  }
}

class EventManipulator {
  constructor(evt, context) {
    this.evt = evt;
    this.context = context;

    this.invalidTimestamps = [];
    this.ignoredArguments = [];

    this.hadAt = false;
  }

  handleAtArg(invitee, at) {
    if (!at) return false;
    this.hadAt = true;

    const ts = Timespan.parse(at, this.context.userTz);
    if (ts.isValid()) {
      this.evt.unfinalize();
      const ind = this.evt.proposeDate(ts);
      this.evt.acceptProposal(invitee, ind);
      this.evt.finalize(ind);
      return true;
    } else {
      this.invalidTimestamps.push(at);
      return false;
    }
  }

  handleNameArg(name) {
    if (!name) return false;

    this.evt.setName(name);
    return true;
  }

  handleProposeArg(invitee, propose) {
    if (!propose) {
      return false;
    }

    if (this.hadAt && propose.length > 0) {
      this.ignoredArguments.push(
        `Ignoring arguments ${propose
          .map(p => `\`--propose ${p}\``)
          .join(", ")} because \`--at\` takes precedence.`
      );
      return false;
    }

    for (const proposeTs of propose) {
      const ts = Timespan.parse(proposeTs, this.context.userTz);
      if (ts.isValid()) {
        const ind = this.evt.proposeDate(ts);
        this.evt.acceptProposal(invitee, ind);
      } else {
        this.invalidTimestamps.push(proposeTs);
      }
    }
    return propose.length > 0;
  }

  handleUnproposeArg(unpropose) {
    if (!unpropose) {
      return false;
    }

    for (const index of unpropose) {
      this.evt.unpropose(index);
    }
    return unpropose.length > 0;
  }

  handleInviteArg(invite) {
    if (!invite) {
      return false;
    }

    for (const invitee of invite) {
      this.evt.invite(this.toInvitee(invitee));
    }
    return invite.length > 0;
  }

  handleUninviteArg(uninvite) {
    if (!uninvite) {
      return false;
    }

    for (const invitee of uninvite) {
      this.evt.uninvite(this.toInvitee(invitee));
    }
    return uninvite.length > 0;
  }

  renderErrorAttachments() {
    const as = [];
    if (this.invalidTimestamps.length > 0) {
      as.push({
        fallback: `Unable to parse: ${this.invalidTimestamps.join(", ")}`,
        title: "Unable to parse proposed dates",
        text:
          "Please use <ISO 8601|https://en.wikipedia.org/wiki/ISO_8601> to format date arguments. " +
          `For example, right now is \`${this.context.now.toISOString()}\`. ` +
          "The time bit may be omitted for whole-day events." +
          `\n\nI couldn't parse: ${this.invalidTimestamps
            .map(i => "`" + i + "`")
            .join(", ")}.`,
        color: "danger",
        mrkdwn_in: ["text"],
      });
    }
    if (this.ignoredArguments.length > 0) {
      as.push({
        fallback: this.ignoredArguments.join("\n"),
        title: "Arguments ignored",
        text: this.ignoredArguments.join("\n"),
        color: "danger",
        mrkdwn_in: ["text"],
      });
    }
    return as;
  }

  renderAllAttachments(ping) {
    const p = new AttachmentPresenter({
      now: this.context.now,
      userSource: this.getUserSource(),
      ping,
    });
    return [p.present(this.evt), ...this.renderErrorAttachments()];
  }

  getUserSource() {
    return new RobotUserSource(this.context.robot);
  }

  toInvitee(identifier) {
    return toInvitee(this.context, identifier);
  }
}

module.exports = {plural, toInvitee, RobotUserSource, EventManipulator};
