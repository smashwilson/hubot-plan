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
}

class Event {
  constructor (id, name) {
    this.id = id
    this.name = name
    this.proposals = []
    this.invitees = new Set()
    this.finalized = null
  }

  getID () { return this.id }

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
    this.proposal(proposalIndex).yes(uid)
    this.remarkLeader()
  }

  rejectProposal (uid, proposalIndex) {
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
}

module.exports = {Event}
