const {buildInvalidProposalError, buildUnfinalizedEventError, buildFinalizedEventError} = require('./errors')
const {Timespan} = require('./timespan')

class Proposal {
  constructor (timespan) {
    this.timespan = timespan
    this.accepted = new Set()
    this.leading = false
  }

  getTimespan () { return this.timespan }

  startDate () { return this.timespan.getStart() }

  endDate () { return this.timespan.getEnd() }

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
      timespan: this.timespan.serialize(),
      accepted: Array.from(this.accepted)
    }
  }

  static deserialize (payload) {
    const p = new Proposal(Timespan.deserialize(payload.timespan))
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
    this.responses = new Set()
    this.finalized = null
    this.earliest = null
    this.latest = null
  }

  getID () { return this.id }

  setName (name) { this.name = name }

  getName () { return this.name }

  proposeDate (ts) {
    if (this.isFinalized()) {
      throw buildFinalizedEventError({eventID: this.id, eventName: this.name})
    }

    const p = new Proposal(ts)
    this.proposals.push(p)

    if (!this.earliest || p.startDate().isBefore(this.earliest.startDate())) {
      this.earliest = p
    }
    if (!this.latest || p.startDate().isAfter(this.latest.startDate())) {
      this.latest = p
    }

    return this.proposals.length - 1
  }

  unpropose (index) {
    if (this.earliest === this.proposals[index]) {
      this.earliest = this.proposals.reduce((min, p, ind) => {
        if (ind === index) return min
        if (min === null) return p
        if (p.startDate().isBefore(min.startDate())) return p
        return min
      }, null)
    }

    if (this.latest === this.proposals[index]) {
      this.latest = this.proposals.reduce((max, p, ind) => {
        if (ind === index) return max
        if (max === null) return p
        if (p.startDate().isAfter(max.startDate())) return p
        return max
      }, null)
    }

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
        eventName: this.name,
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
    for (const p of this.proposals) {
      p.no(uid)
    }
  }

  getInvitees () {
    return Array.from(this.invitees)
  }

  acceptProposal (uid, proposalIndex) {
    this.invitees.add(uid)
    this.responses.add(uid)
    this.proposal(proposalIndex).yes(uid)
    this.remarkLeader()
  }

  rejectProposal (uid, proposalIndex) {
    this.responses.add(uid)
    this.proposal(proposalIndex).no(uid)
    this.remarkLeader()
  }

  responded (uid) {
    this.responses.add(uid)
  }

  finalize (index) {
    if (this.proposals[index] === undefined) {
      throw buildInvalidProposalError({
        eventID: this.id,
        eventName: this.name,
        proposal: index
      })
    }

    if (this.isFinalized()) {
      throw buildFinalizedEventError({eventID: this.id, eventName: this.name})
    }

    this.finalized = index
  }

  finalProposal () {
    if (this.finalized === null) {
      throw buildUnfinalizedEventError({
        eventID: this.id,
        eventName: this.name
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
    let leadingCount = 2
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

  earliestComparisonDate () {
    if (this.isFinalized()) {
      return this.finalProposal().startDate()
    } else if (this.earliest) {
      return this.earliest.startDate()
    } else {
      return null
    }
  }

  latestComparisonDate () {
    if (this.isFinalized()) {
      return this.finalProposal().startDate()
    } else if (this.latest) {
      return this.latest.startDate()
    } else {
      return null
    }
  }

  compareTo (other) {
    const a = this.earliestComparisonDate()
    const b = other.earliestComparisonDate()

    if (a === b) return 0
    if (a === null) return -1
    if (b === null) return 1
    if (a.isSame(b)) return 0

    return a.isBefore(b) ? -1 : 1
  }

  matches (filter) {
    let m = true
    const e = this.earliestComparisonDate()
    const l = this.latestComparisonDate()

    if (filter.name) {
      if (!this.name.toLowerCase().includes(filter.name.toLowerCase())) m = false
    }

    if (filter.finalized) {
      if (!this.isFinalized()) m = false
    }

    if (filter.unfinalized) {
      if (this.isFinalized()) m = false
    }

    if (filter.before && e !== null) {
      if (e.isAfter(filter.before)) m = false
    }

    if (filter.after && l !== null) {
      if (l.isBefore(filter.after)) m = false
    }

    if (filter.invited) {
      if (!this.invitees.has(filter.invited)) m = false
    }

    return m
  }

  asLine () {
    let str = `\`${this.id}\` `
    if (this.isFinalized()) {
      str += `${this.name} ${this.finalProposal().getTimespan().renderStart()}`
    } else {
      str += `_${this.name}_`
      if (this.proposals.length > 0) str += ' '
      str += this.proposals.map(p => p.getTimespan().renderStart()).join(', ')
    }
    return str
  }

  asAttachment (ref) {
    const a = {
      fallback: `${this.id}: ${this.name}`,
      title: `\`${this.id}\` :calendar: ${this.name}`,
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
          let str = `[${index}] ${proposal.getTimespan().renderRange()}`
          str += ` _${proposal.startDate().from(ref)}_`
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
        const value = '_Responses_\n' + Array.from(this.invitees, uid => {
          let str = ''
          if (this.responses.has(uid)) {
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
        value: `${proposal.getTimespan().renderRange()} _${proposal.startDate().from(ref)}_`
      })

      if (this.invitees.size > 0) {
        const value = '_Attendees_\n' + Array.from(this.invitees, uid => {
          let str = ''
          if (!this.responses.has(uid)) {
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

  renderICalOn (robot, builder) {
    const attendeeFrom = (status, uid) => {
      const m = /<@([^>]+)>/.exec(uid)
      const user = m && robot.brain.users()[m[1]]

      if (user && user.name && user.email_address) {
        return {name: user.name, email: user.email_address, status}
      } else {
        return {name: uid, email: uid, status}
      }
    }

    const eventFrom = (transp, status, proposal) => {
      const attendees = proposal.getAttendees().map(attendeeFrom.bind(this, 'ACCEPTED'))
      for (const respondant of this.responses) {
        if (!proposal.isAttending(respondant)) {
          attendees.push(attendeeFrom(respondant, 'DECLINED'))
        }
      }

      return {
        start: proposal.startDate().toDate(),
        end: proposal.endDate().toDate(),
        transp,
        summary: this.name,
        description: `ID: ${this.id}`,
        allDay: proposal.getTimespan().isFullDay(),
        attendees,
        status
      }
    }

    if (this.isFinalized()) {
      builder.events.push(eventFrom('OPAQUE', 'CONFIRMED', this.finalProposal()))
    } else {
      builder.events.push(
        ...this.proposals.map(eventFrom.bind(this, 'TRANSPARENT', 'TENTATIVE'))
      )
    }
  }

  serialize () {
    return {
      id: this.id,
      name: this.name,
      invitees: Array.from(this.invitees),
      responses: Array.from(this.responses),
      finalized: this.finalized,
      proposals: this.proposals.map(p => p.serialize())
    }
  }

  static deserialize (payload) {
    const e = new Event(payload.id, payload.name)
    e.invitees = new Set(payload.invitees)
    e.responses = new Set(payload.responses)
    e.proposals = payload.proposals.map(Proposal.deserialize)
    e.finalized = payload.finalized
    return e
  }
}

module.exports = {Event}
