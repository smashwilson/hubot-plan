const {Timespan} = require('../timespan')

function plural (count, singular, plural = singular + 's') {
  if (count === 1) {
    return `${count} ${singular}`
  } else {
    return `${count} ${plural}`
  }
}

function toUid (context, username) {
  let trimmed = username.replace(/^@/g, '')
  if (trimmed === 'me') trimmed = context.msg.message.user.name
  const u = context.robot.brain.userForName(trimmed)
  return u ? `<@${u.id}>` : trimmed
}

class EventManipulator {
  constructor (evt, context) {
    this.evt = evt
    this.context = context

    this.invalidTimestamps = []
    this.ignoredArguments = []

    this.hadAt = false
  }

  handleAtArg (uid, at) {
    if (!at) return false
    this.hadAt = true

    const ts = Timespan.parse(at, this.context.userTz)
    if (ts.isValid()) {
      this.evt.proposeDate(ts)
      this.evt.acceptProposal(uid, 0)
      this.evt.finalize(0)
      return true
    } else {
      this.invalidTimestamps.push(at)
      return false
    }
  }

  handleNameArg (name) {
    if (!name) return false

    this.evt.setName(name)
    return true
  }

  handleProposeArg (uid, propose) {
    if (this.hadAt && propose.length > 0) {
      this.ignoredArguments.push(
        `Ignoring arguments ${propose.map(p => `\`--propose ${p}\``).join(', ')} because \`--at\` takes precedence.`
      )
      return false
    }

    for (const proposeTs of propose) {
      const ts = Timespan.parse(proposeTs, this.context.userTz)
      if (ts.isValid()) {
        const ind = this.evt.proposeDate(ts)
        this.evt.acceptProposal(uid, ind)
      } else {
        this.invalidTimestamps.push(proposeTs)
      }
    }
    return propose.length > 0
  }

  handleUnproposeArg (unpropose) {
    for (const index of unpropose) {
      this.evt.unpropose(index)
    }
    return unpropose.length > 0
  }

  handleInviteArg (invite) {
    for (const invitee of invite) {
      this.evt.invite(this.toUid(invitee))
    }
    return invite.length > 0
  }

  handleUninviteArg (uninvite) {
    for (const invitee of uninvite) {
      this.evt.uninvite(this.toUid(invitee))
    }
    return uninvite.length > 0
  }

  renderErrorAttachments () {
    const as = []
    if (this.invalidTimestamps.length > 0) {
      as.push({
        fallback: `Unable to parse: ${this.invalidTimestamps.join(', ')}`,
        title: 'Unable to parse proposed dates',
        text:
          'Please use <ISO 8601|https://en.wikipedia.org/wiki/ISO_8601> to format date arguments. ' +
          `For example, right now is \`${this.context.now.toISOString()}\`. ` +
          'The time bit may be omitted for whole-day events.' +
          `\n\nI couldn't parse: ${this.invalidTimestamps.map(i => '`' + i + '`').join(', ')}.`,
        color: 'danger',
        mrkdwn_in: ['text']
      })
    }
    if (this.ignoredArguments.length > 0) {
      as.push({
        fallback: this.ignoredArguments.join('\n'),
        title: 'Arguments ignored',
        text: this.ignoredArguments.join('\n'),
        color: 'danger',
        mrkdwn_in: ['text']
      })
    }
    return as
  }

  renderAllAttachments () {
    return [this.evt.asAttachment(this.context.now), ...this.renderErrorAttachments()]
  }

  toUid (username) {
    return toUid(this.context, username)
  }
}

module.exports = {plural, toUid, EventManipulator}
