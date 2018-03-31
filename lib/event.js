const {
  buildInvalidProposalError,
  buildUnfinalizedEventError,
  buildFinalizedEventError,
  buildNoProposalsError,
  buildMultipleProposalsError
} = require('./errors')
const {Timespan} = require('./timespan')
const {Invitee} = require('./invitee')

function inviteeMap (payloadList) {
  return new Map(payloadList.map(payload => {
    const i = Invitee.deserialize(payload)
    return [i.getKey(), i]
  }))
}

class Proposal {
  constructor (timespan) {
    this.timespan = timespan
    this.accepted = new Map()
    this.leading = false
  }

  getTimespan () { return this.timespan }

  startDate () { return this.timespan.getStart() }

  endDate () { return this.timespan.getEnd() }

  yesCount () { return this.accepted.size }

  isLeading () { return this.leading }

  yes (invitee) { this.accepted.set(invitee.getKey(), invitee) }

  no (invitee) { this.accepted.delete(invitee.getKey()) }

  isAttending (invitee) { return this.accepted.has(invitee.getKey()) }

  getAttendees () { return Array.from(this.accepted.values()) }

  markLeader () { this.leading = true }

  clearLeader () { this.leading = false }

  serialize () {
    return {
      timespan: this.timespan.serialize(),
      accepted: Array.from(this.accepted.values(), inv => inv.serialize())
    }
  }

  static deserialize (payload) {
    const p = new Proposal(Timespan.deserialize(payload.timespan))
    p.accepted = inviteeMap(payload.accepted)
    return p
  }
}

class Event {
  constructor (id, name) {
    this.id = id
    this.name = name
    this.proposals = []
    this.invitees = new Map()
    this.responses = new Map()
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

  invite (invitee) {
    this.invitees.set(invitee.getKey(), invitee)
  }

  uninvite (invitee) {
    this.invitees.delete(invitee.getKey())
    for (const p of this.proposals) {
      p.no(invitee)
    }
  }

  getInvitees () {
    return Array.from(this.invitees.values())
  }

  acceptProposal (invitee, proposalIndex) {
    this.invitees.set(invitee.getKey(), invitee)
    this.responses.set(invitee.getKey(), invitee)
    this.proposal(proposalIndex).yes(invitee)
    this.remarkLeader()
  }

  rejectProposal (invitee, proposalIndex) {
    this.responses.set(invitee.getKey(), invitee)
    this.proposal(proposalIndex).no(invitee)
    this.remarkLeader()
  }

  responded (invitee) {
    this.responses.set(invitee.getKey(), invitee)
  }

  finalize (index) {
    if (index === undefined || index === null) {
      const keys = this.proposalKeys()
      if (keys.length === 0) {
        throw buildNoProposalsError({eventID: this.id, eventName: this.name})
      }
      if (keys.length > 1) {
        throw buildMultipleProposalsError({eventID: this.id, eventName: this.name, proposalCount: keys.length})
      }
      index = keys[0]
    }

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
    for (const proposal of this.proposals.filter(Boolean)) {
      if (proposal.yesCount() > leadingCount) {
        leadingCount = proposal.yesCount()
      }
    }
    for (const proposal of this.proposals.filter(Boolean)) {
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
      if (!this.invitees.has(filter.invited.getKey())) m = false
    }

    return m
  }

  presentWith (presenter) {
    return this.isFinalized() ? presenter.presentFinalized(this) : presenter.presentUnfinalized(this)
  }

  serialize () {
    return {
      id: this.id,
      name: this.name,
      invitees: Array.from(this.invitees.values(), inv => inv.serialize()),
      responses: Array.from(this.responses.values(), inv => inv.serialize()),
      finalized: this.finalized,
      proposals: this.proposals.map(p => p !== undefined ? p.serialize() : null)
    }
  }

  static deserialize (payload) {
    const e = new Event(payload.id, payload.name)
    e.invitees = inviteeMap(payload.invitees)
    e.responses = inviteeMap(payload.responses)
    e.proposals = payload.proposals.map(p => p !== null ? Proposal.deserialize(p) : undefined)
    e.finalized = payload.finalized
    return e
  }
}

module.exports = {Event}
