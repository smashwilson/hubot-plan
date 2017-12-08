const moment = require('moment-timezone')

const {buildInvalidProposalError, buildUnfinalizedEventError} = require('./errors')

class Proposal {
  constructor (ts) {
    this.ts = ts
    this.accepted = new Set()
    this.leading = false
  }

  date () { return this.ts }

  yesCount () { return this.accepted.size }

  isLeading () { return this.leading }

  yes (uid) { this.accepted.add(uid) }

  no (uid) { this.accepted.delete(uid) }

  isAttending (uid) { return this.accepted.has(uid) }

  getAttendees () { return Array.from(this.accepted) }

  markLeader () { this.leading = true }

  clearLeader () { this.leading = false }

  serialize () {
    return {
      ts: this.ts.valueOf(),
      zone: this.ts.tz(),
      accepted: Array.from(this.accepted)
    }
  }

  static deserialize (payload) {
    const p = new Proposal(moment.tz(payload.ts, payload.zone))
    p.accepted = new Set(payload.accepted)
    return p
  }
}

class Event {
  constructor (id, name) {
    this.id = id
    this.name = name
    this.proposals = []
    this.invitees = new Set()
    this.responded = new Set()
    this.finalized = null
  }

  getID () { return this.id }

  setName (name) { this.name = name }

  getName () { return this.name }

  proposeDate (ts) {
    this.proposals.push(new Proposal(ts))
  }

  unpropose (index) {
    delete this.proposals[index]
    if (this.finalized === index) this.finalized = null
  }

  proposalKeys () {
    return Object.keys(this.proposals).map(k => parseInt(k, 10))
  }

  proposal (index) {
    const p = this.proposals[index]
    if (p === undefined) {
      throw buildInvalidProposalError({
        eventID: this.id,
        proposal: index
      })
    }
    return p
  }

  invite (uid) {
    this.invitees.add(uid)
  }

  uninvite (uid) {
    this.invitees.delete(uid)
  }

  getInvitees () {
    return Array.from(this.invitees)
  }

  acceptProposal (uid, proposalIndex) {
    this.invitees.add(uid)
    this.responded.add(uid)
    this.proposal(proposalIndex).yes(uid)
    this.remarkLeader()
  }

  rejectProposal (uid, proposalIndex) {
    this.responded.add(uid)
    this.proposal(proposalIndex).no(uid)
    this.remarkLeader()
  }

  finalize (index) {
    if (this.proposals[index] === undefined) {
      throw buildInvalidProposalError({
        eventID: this.id,
        proposal: index
      })
    }

    this.finalized = index
  }

  finalProposal () {
    if (this.finalized === null) {
      throw buildUnfinalizedEventError({
        eventID: this.id
      })
    }
    return this.proposal(this.finalized)
  }

  unfinalize () {
    this.finalized = null
  }

  isFinalized () {
    return this.finalized !== null
  }

  remarkLeader () {
    let leadingCount = 1
    for (const proposal of this.proposals) {
      if (proposal.yesCount() > leadingCount) {
        leadingCount = proposal.yesCount()
      }
    }
    for (const proposal of this.proposals) {
      if (proposal.yesCount() === leadingCount) {
        proposal.markLeader()
      } else {
        proposal.clearLeader()
      }
    }
  }

  asAttachment (ref) {
    const a = {
      fallback: `${this.id}: ${this.name}`,
      title: `${this.id} :calendar: ${this.name}`,
      fields: [],
      mrkdwn_in: ['fields']
    }

    if (this.finalized === null) {
      if (this.proposals.length === 0) {
        a.fields.push({
          title: 'Proposed Dates',
          value: '_none yet_'
        })
      } else {
        const value = this.proposals.map((proposal, index) => {
          let str = `[${index}] ${proposal.date().format('D MMMM YYYY')}`
          str += ` _${proposal.date().from(ref)}_`
          if (proposal.isLeading()) {
            str += ' :medal:'
          }
          if (proposal.yesCount() > 0) {
            str += ` x${proposal.yesCount()}`
          }
          return str
        }).filter(Boolean).join('\n')
        a.fields.push({title: 'Proposed Dates', value})
      }

      if (this.invitees.size > 0) {
        const value = Array.from(this.invitees, uid => {
          let str = ''
          if (this.responded.has(uid)) {
            str += ':white_square_button:'
          } else {
            str += ':white_square:'
          }
          str += ` ${uid}`
          return str
        }).join(' | ')

        a.fields.push({title: 'Who', value})
      }
    } else {
      const proposal = this.finalProposal()
      a.fields.push({
        title: 'When',
        value: `${proposal.date().format('D MMMM YYYY')} _${proposal.date().from(ref)}_`
      })

      if (this.invitees.size > 0) {
        const value = Array.from(this.invitees, uid => {
          let str = ''
          if (!this.responded.has(uid)) {
            str += ':grey_question:'
          } else if (proposal.isAttending(uid)) {
            str += ':white_check_mark:'
          } else {
            str += ':red_circle:'
          }

          str += ` ${uid}`
          return str
        }).join(' | ')

        a.fields.push({title: 'Who', value})
      }
    }

    return a
  }

  serialize () {
    return {
      id: this.id,
      name: this.name,
      invitees: Array.from(this.invitees),
      responded: Array.from(this.responded),
      finalized: this.finalized,
      proposals: this.proposals.map(p => p.serialize())
    }
  }

  static deserialize (payload) {
    const e = new Event(payload.id, payload.name)
    e.invitees = new Set(payload.invitees)
    e.responded = new Set(payload.responded)
    e.proposals = payload.proposals.map(Proposal.deserialize)
    e.finalized = payload.finalized
    return e
  }
}

module.exports = {Event}
