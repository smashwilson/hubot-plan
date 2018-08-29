const ical = require('ical-toolkit')

const { Presenter } = require('./presenter')

class ICalPresenter extends Presenter {
  constructor (options) {
    super(options)

    this.builder = options.builder || ical.createIcsFileBuilder()
    this.builder.spacers = false
    this.builder.throwError = true
    this.builder.ignoreTZIDMismatch = false

    this.builder.calname = options.calendarName || 'hubot-plan events'
    this.builder.timezone = options.userTz || 'America/New_York'
    this.builder.tzid = options.userTz || 'America/New_York'
  }

  present (subject) {
    super.present(subject)
    return this.builder.toString()
  }

  presentUnfinalized (evt) {
    for (const proposal of evt.proposals) {
      if (!proposal) continue

      this.builder.events.push(
        this.buildICalEvent(evt, proposal, 'TRANSPARENT', 'TENTATIVE')
      )
    }
  }

  presentFinalized (evt) {
    this.builder.events.push(
      this.buildICalEvent(evt, evt.finalProposal(), 'OPAQUE', 'CONFIRMED')
    )
  }

  buildAttendee (invitee, status) {
    return {
      name: invitee.mention(this.userSource),
      email: invitee.email(this.userSource),
      status
    }
  }

  buildICalEvent (evt, proposal, transp, status) {
    const attendees = proposal.getAttendees().map(invitee => {
      return this.buildAttendee(invitee, 'ACCEPTED')
    })
    for (const respondant of evt.responses.values()) {
      if (!proposal.isAttending(respondant)) {
        attendees.push(this.buildAttendee(respondant, 'DECLINED'))
      }
    }

    return {
      start: proposal.startDate().toDate(),
      end: proposal.endDate().toDate(),
      transp,
      summary: evt.getName(),
      description: `ID: ${evt.getID()}`,
      allDay: proposal.getTimespan().isFullDay(),
      attendees,
      status
    }
  }
}

module.exports = { ICalPresenter }
