const moment = require('moment-timezone')

class EventManipulator {
  constructor (evt, context) {
    this.evt = evt
    this.context = context

    this.invalidTimestamps = []
    this.ignoredArguments = []

    this.hadAt = false
  }

  handleAtArg (at) {
    if (!at) return
    this.hadAt = true

    const ts = moment.tz(at, moment.ISO_8601, true, this.context.userTz)
    if (ts.isValid()) {
      this.evt.proposeDate(ts)
      this.evt.finalize(0)
    } else {
      this.invalidTimestamps.push(at)
    }
  }

  handleProposeArg (propose) {
    if (this.hadAt && propose.length > 0) {
      this.ignoredArguments.push(
        `Ignoring arguments ${propose.map(p => `\`--propose ${p}\``).join(', ')} because \`--at\` takes precedence.`
      )
      return
    }

    for (const proposeTs of propose) {
      const ts = moment.tz(proposeTs, moment.ISO_8601, true, this.context.userTz)
      if (ts.isValid()) {
        this.evt.proposeDate(ts)
      } else {
        this.invalidTimestamps.push(proposeTs)
      }
    }
  }

  handleUnproposeArg (unpropose) {
    for (const index of unpropose) {
      this.evt.unpropose(index)
    }
  }

  handleInviteArg (invite) {
    for (const invitee of invite) {
      const trimmed = invitee.replace(/^@/g, '')
      const uid = this.context.robot.brain.userForName(trimmed)
      if (uid) {
        this.evt.invite(`<@${uid.id}>`)
      } else {
        this.evt.invite(trimmed)
      }
    }
  }

  handleUninviteArg (uninvite) {
    for (const invitee of uninvite) {
      const trimmed = invitee.replace(/^@/g, '')
      const uid = this.context.robot.brain.userForName(trimmed)
      if (uid) {
        this.evt.uninvite(`<@${uid.id}>`)
      } else {
        this.evt.uninvite(trimmed)
      }
    }
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
}

module.exports = {EventManipulator}
