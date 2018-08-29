const { Presenter } = require('./presenter')

class AttachmentPresenter extends Presenter {
  presentUnfinalized (evt) {
    const a = this.base(evt)
    this.addField(a, this.proposedDatesField(evt))
    this.addField(a, this.inviteeResponseField(evt))
    return a
  }

  presentFinalized (evt) {
    const a = this.base(evt)
    this.addField(a, this.finalizedDateField(evt))
    this.addField(a, this.inviteeConfirmationField(evt))
    return a
  }

  base (evt) {
    return {
      fallback: `${evt.getID()}: ${evt.getName()}`,
      title: `${evt.getID()} :calendar: ${evt.getName()}`,
      fields: [],
      mrkdwn_in: ['fields']
    }
  }

  addField (a, field) {
    if (field) {
      a.fields.push(field)
    }
  }

  showInvitee (invitee) {
    return this.ping ? invitee.notify(this.userSource) : invitee.mention(this.userSource)
  }

  proposedDatesField (evt) {
    if (!evt.proposals.some(Boolean)) {
      return {
        title: 'Proposed Dates',
        value: '_none yet_'
      }
    }

    const value = evt.proposals.map((proposal, index) => {
      if (!proposal) return null

      let str = `[${index}] ${proposal.getTimespan().renderRange()}`
      str += ` _${proposal.startDate().from(this.now)}_`
      if (proposal.isLeading()) {
        str += ' :medal:'
      }
      if (proposal.yesCount() > 0) {
        str += ` x${proposal.yesCount()}`
      }
      return str
    }).filter(Boolean).join('\n')

    return {
      title: 'Proposed Dates',
      value
    }
  }

  finalizedDateField (evt) {
    const proposal = evt.finalProposal()
    return {
      title: 'When',
      value: `${proposal.getTimespan().renderRange()} _${proposal.startDate().from(this.now)}_`
    }
  }

  inviteeResponseField (evt) {
    if (evt.invitees.size === 0) {
      return null
    }

    const value = '_Responses_\n' + Array.from(evt.invitees.values(), invitee => {
      let str = ''
      if (evt.responses.has(invitee.getKey())) {
        str += ':white_square_button:'
      } else {
        str += ':white_square:'
      }
      str += ` ${this.showInvitee(invitee)}`
      return str
    }).join(' | ')

    return {
      title: 'Who',
      value
    }
  }

  inviteeConfirmationField (evt) {
    if (evt.invitees.size === 0) {
      return null
    }

    const proposal = evt.finalProposal()
    const value = `_Attendees (${proposal.yesCount()} confirmed)_\n` + Array.from(evt.invitees.values(), invitee => {
      let str = ''
      if (!evt.responses.has(invitee.getKey())) {
        str += ':grey_question:'
      } else if (proposal.isAttending(invitee)) {
        str += ':white_check_mark:'
      } else {
        str += ':red_circle:'
      }

      str += ` ${this.showInvitee(invitee)}`
      return str
    }).join(' | ')

    return {
      title: 'Who',
      value
    }
  }
}

module.exports = { AttachmentPresenter }
