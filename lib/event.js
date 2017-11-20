class Proposal {
  constructor (ts) {
    this.ts = ts
    this.accepted = new Set()
    this.leading = false
  }

  date () { return this.ts }

  yesCount () { return this.accepted.size }

  isValid () { return true }

  isLeading () { return this.leading }

  yes (uid) { this.accepted.add(uid) }

  no (uid) { this.accepted.delete(uid) }

  isAttending (uid) { return this.accepted.has(uid) }

  getAttendees () { return Array.from(this.accepted) }

  markLeader () { this.leading = true }

  clearLeader () { this.leading = false }
}

const nullProposal = {
  date () { return null },

  yesCount () { return 0 },

  isValid () { return false },

  isLeading () { return false },

  yes (uid) {},

  no (uid) {},

  isAttending (uid) { return false },

  getAttendees () { return [] },

  markLeader () {},

  clearLeader () {}
}

class Event {
  constructor (name) {
    this.name = name
    this.proposals = []
    this.invitees = new Set()
  }

  proposeDate (ts) {
    this.proposals.push(new Proposal(ts))
  }

  unpropose (index) {
    delete this.proposals[index]
  }

  proposalKeys () {
    return Object.keys(this.proposals).map(k => parseInt(k, 10))
  }

  proposal (index) {
    return this.proposals[index] || nullProposal
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

  finalize (index) {
    return new Finalization(this, this.proposal(index))
  }
}

class Finalization {
  constructor (event, proposal) {
    this.event = event
    this.proposal = proposal
  }

  refinalize (index) {
    this.proposal = this.event.proposal(index)
  }
}

function delegate (target, methods) {
  for (const method of methods) {
    Finalization.prototype[method] = function (...args) {
      return this[target][method](...args)
    }
  }
}

delegate('event', ['invite', 'uninvite', 'getInvitees'])
delegate('proposal', ['yes', 'no', 'isAttending', 'getAttendees'])

module.exports = {Event}
