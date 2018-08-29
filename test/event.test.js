/* eslint-env mocha */

const assert = require('chai').assert

const { ts } = require('./bot-context')
const { Event } = require('../lib/event')
const { Invitee } = require('../lib/invitee')

describe('Event', function () {
  const u = {
    frey: Invitee.free('frey'),
    fenris: Invitee.free('fenris'),
    reostra: Invitee.free('reostra'),
    hubot: Invitee.free('hubot')
  }

  describe('in the proposed state', function () {
    let evt

    beforeEach(function () {
      evt = new Event('AAA', "Party at Frey's House")
      evt.proposeDate(ts.tomorrow)
    })

    it('adds proposed dates', function () {
      evt.proposeDate(ts.nextWeek)

      assert.deepEqual(evt.proposalKeys(), [0, 1])
      assert.equal(evt.proposal(0).startDate(), ts.tomorrow.getStart())
      assert.equal(evt.proposal(1).startDate(), ts.nextWeek.getStart())
    })

    it('removes proposed dates', function () {
      evt.proposeDate(ts.nextMonth)

      evt.unpropose(0)

      assert.deepEqual(evt.proposalKeys(), [1])
      assert.equal(evt.proposal(1).startDate(), ts.nextMonth.getStart())
      assert.throws(() => evt.proposal(0), 'Invalid proposed date')
    })

    it('adds invitees', function () {
      evt.invite(u.frey)
      evt.invite(u.fenris)

      assert.deepEqual(evt.getInvitees(), [u.frey, u.fenris])
    })

    it('removes invitees', function () {
      evt.invite(u.frey)
      evt.invite(u.hubot)
      evt.invite(u.fenris)

      evt.uninvite(Invitee.free('hubot'))

      assert.deepEqual(evt.getInvitees(), [u.frey, u.fenris])
    })

    it('tracks which invitees accept or reject proposed dates', function () {
      evt.invite(u.frey)
      evt.invite(u.fenris)
      evt.invite(u.reostra)

      evt.proposeDate(ts.nextWeek)
      evt.proposeDate(ts.nextMonth)

      assert.equal(evt.proposal(0).getTimespan(), ts.tomorrow)
      assert.equal(evt.proposal(0).yesCount(), 0)
      assert.isFalse(evt.proposal(0).isLeading())
      assert.equal(evt.proposal(1).getTimespan(), ts.nextWeek)
      assert.equal(evt.proposal(1).yesCount(), 0)
      assert.isFalse(evt.proposal(1).isLeading())
      assert.equal(evt.proposal(2).getTimespan(), ts.nextMonth)
      assert.equal(evt.proposal(2).yesCount(), 0)
      assert.isFalse(evt.proposal(2).isLeading())

      evt.acceptProposal(u.frey, 0)
      evt.acceptProposal(u.fenris, 0)
      evt.acceptProposal(u.fenris, 1)
      evt.acceptProposal(u.reostra, 0)
      evt.acceptProposal(u.reostra, 1)
      evt.acceptProposal(u.reostra, 2)

      assert.equal(evt.proposal(0).getTimespan(), ts.tomorrow)
      assert.equal(evt.proposal(0).yesCount(), 3)
      assert.isTrue(evt.proposal(0).isLeading())
      assert.equal(evt.proposal(1).getTimespan(), ts.nextWeek)
      assert.equal(evt.proposal(1).yesCount(), 2)
      assert.isFalse(evt.proposal(1).isLeading())
      assert.equal(evt.proposal(2).getTimespan(), ts.nextMonth)
      assert.equal(evt.proposal(2).yesCount(), 1)
      assert.isFalse(evt.proposal(2).isLeading())
    })

    it('accepts proposed dates after proposals have been unproposed', function () {
      evt.unpropose(0)
      evt.proposeDate(ts.nextMonth)
      evt.acceptProposal(u.frey, 1)

      assert.deepEqual(evt.proposalKeys(), [1])
      assert.equal(evt.proposal(1).getTimespan(), ts.nextMonth)
      assert.equal(evt.proposal(1).yesCount(), 1)
    })

    describe('becoming finalized', function () {
      beforeEach(function () {
        evt.invite(u.frey)
        evt.invite(u.fenris)
        evt.invite(u.reostra)

        evt.proposeDate(ts.nextWeek)
        evt.proposeDate(ts.nextMonth)

        evt.acceptProposal(u.frey, 0)
        evt.acceptProposal(u.fenris, 0)
        evt.acceptProposal(u.fenris, 1)
        evt.acceptProposal(u.reostra, 0)
        evt.acceptProposal(u.reostra, 1)
        evt.acceptProposal(u.reostra, 2)
      })

      it('transitions invitees to yes or no based on their response to the final date', function () {
        evt.finalize(1)

        assert.isFalse(evt.finalProposal().isAttending(u.frey))
        assert.isTrue(evt.finalProposal().isAttending(u.fenris))
        assert.isTrue(evt.finalProposal().isAttending(u.reostra))
      })
    })
  })

  describe('in the finalized state', function () {
    let evt

    beforeEach(function () {
      evt = new Event('BBB', "Party at Frey's House")
      evt.proposeDate(ts.tomorrow)
      evt.proposeDate(ts.nextWeek)
      evt.proposeDate(ts.nextMonth)
      evt.invite(u.frey)
      evt.invite(u.fenris)

      evt.acceptProposal(u.fenris, 2)

      evt.finalize(0)
    })

    it('adds invitees', function () {
      evt.invite(u.reostra)

      assert.deepEqual(evt.getInvitees(), [u.frey, u.fenris, u.reostra])
    })

    it('removes invitees', function () {
      evt.uninvite(u.fenris)

      assert.deepEqual(evt.getInvitees(), [u.frey])
    })

    it('tracks which invitees confirm or deny', function () {
      assert.isFalse(evt.finalProposal().isAttending(u.frey))
      assert.isFalse(evt.finalProposal().isAttending(u.fenris))
      assert.isFalse(evt.finalProposal().isAttending(u.reostra))

      evt.finalProposal().yes(u.fenris)
      evt.finalProposal().yes(u.reostra)

      assert.isFalse(evt.finalProposal().isAttending(u.frey))
      assert.isTrue(evt.finalProposal().isAttending(u.fenris))
      assert.isTrue(evt.finalProposal().isAttending(u.reostra))
    })

    it('cannot be re-finalized', function () {
      assert.throws(() => evt.finalize(1), /Event already finalized/)
    })

    it('cannot have additional dates proposed', function () {
      assert.throws(() => evt.proposeDate(ts.nextWeek), /Event already finalized/)
    })
  })

  it('serializes and deserializes itself', function () {
    const evt0 = new Event('BBB', "Party at Frey's House")

    evt0.proposeDate(ts.tomorrow)
    evt0.proposeDate(ts.nextWeek)
    evt0.invite(u.frey)
    evt0.invite(u.fenris)
    evt0.acceptProposal(u.fenris, 0)
    evt0.invite(u.reostra)
    evt0.rejectProposal(u.reostra, 0)
    evt0.rejectProposal(u.reostra, 1)
    evt0.acceptProposal(u.hubot, 1)

    const payload = evt0.serialize()
    const evt1 = Event.deserialize(payload)

    assert.equal(evt1.getName(), "Party at Frey's House")
    assert.deepEqual(evt1.proposalKeys(), [0, 1])
    assert.equal(evt1.proposal(0).startDate().valueOf(), ts.tomorrow.getStart().valueOf())
    assert.equal(evt1.proposal(1).startDate().valueOf(), ts.nextWeek.getStart().valueOf())
    assert.deepEqual(evt1.getInvitees(), [u.frey, u.fenris, u.reostra, u.hubot])
  })

  describe('comparison', function () {
    it('orders finalized events by chosen date', function () {
      const evt = new Event('AAA', 'Event A')
      evt.proposeDate(ts.tomorrow)
      evt.finalize(0)

      const before = new Event('BBB', 'Event B')
      before.proposeDate(ts.now)
      before.finalize(0)

      const equal = new Event('CCC', 'Event C')
      equal.proposeDate(ts.tomorrow)
      equal.finalize(0)

      const after = new Event('DDD', 'Event D')
      after.proposeDate(ts.nextWeek)
      after.finalize(0)

      assert.isAbove(evt.compareTo(before), 0)
      assert.equal(evt.compareTo(equal), 0)
      assert.isBelow(evt.compareTo(after), 0)
    })

    it('orders unfinalized events by earliest proposed date', function () {
      const evt = new Event('AAA', 'Event A')
      evt.proposeDate(ts.tomorrow)
      evt.proposeDate(ts.nextWeek)
      evt.proposeDate(ts.nextMonth)

      const before = new Event('BBB', 'Event B')
      before.proposeDate(ts.now)
      before.proposeDate(ts.nextWeek)

      const equal = new Event('CCC', 'Event C')
      equal.proposeDate(ts.nextMonth)
      equal.proposeDate(ts.tomorrow)

      const after = new Event('DDD', 'Event D')
      after.proposeDate(ts.nextWeek)
      after.proposeDate(ts.nextMonth)

      assert.isAbove(evt.compareTo(before), 0)
      assert.equal(evt.compareTo(equal), 0)
      assert.isBelow(evt.compareTo(after), 0)
    })

    it('orders events with no proposed dates before everything else', function () {
      const evt = new Event('AAA', 'Event A')

      const proposed = new Event('BBB', 'Event B')
      proposed.proposeDate(ts.now)
      proposed.proposeDate(ts.tomorrow)

      const finalized = new Event('CCC', 'Event C')
      finalized.proposeDate(ts.nextWeek)
      finalized.finalize(0)

      const equal = new Event('DDD', 'Event D')

      assert.isBelow(evt.compareTo(proposed), 0)
      assert.isBelow(evt.compareTo(finalized), 0)
      assert.equal(evt.compareTo(equal), 0)
    })
  })

  describe('filtering', function () {
    it('matches by name', function () {
      const evt = new Event('ABC', 'aaa bbb ccc')

      assert.isTrue(evt.matches({ name: 'bB' }))
      assert.isFalse(evt.matches({ name: 'qqq' }))
    })

    it('matches a finalized event before a timestamp', function () {
      const evt = new Event('yes', 'yes')
      evt.proposeDate(ts.tomorrow)
      evt.finalize(0)

      assert.isFalse(evt.matches({ before: ts.now.getStart() }))
      assert.isTrue(evt.matches({ before: ts.tomorrow.getStart() }))
      assert.isTrue(evt.matches({ before: ts.nextWeek.getStart() }))
    })

    it('matches an unfinalized event before a timestamp', function () {
      const evt = new Event('yes', 'yes')
      evt.proposeDate(ts.nextMonth)
      evt.proposeDate(ts.tomorrow)

      assert.isFalse(evt.matches({ before: ts.now.getStart() }))
      assert.isTrue(evt.matches({ before: ts.tomorrow.getStart() }))
      assert.isTrue(evt.matches({ before: ts.nextWeek.getStart() }))
    })

    it('matches a finalized event after a timestamp', function () {
      const evt = new Event('yes', 'yes')
      evt.proposeDate(ts.tomorrow)
      evt.finalize(0)

      assert.isTrue(evt.matches({ after: ts.now.getStart() }))
      assert.isTrue(evt.matches({ after: ts.tomorrow.getStart() }))
      assert.isFalse(evt.matches({ after: ts.nextWeek.getStart() }))
    })

    it('matches an unfinalized event after a timestamp', function () {
      const evt = new Event('yes', 'yes')
      evt.proposeDate(ts.nextWeek)
      evt.proposeDate(ts.tomorrow)

      assert.isTrue(evt.matches({ after: ts.now.getStart() }))
      assert.isTrue(evt.matches({ after: ts.nextWeek.getStart() }))
      assert.isFalse(evt.matches({ after: ts.nextMonth.getStart() }))
    })

    it('matches by finalized status', function () {
      const yes = new Event('yes', 'yes')
      yes.proposeDate(ts.now)
      yes.proposeDate(ts.nextMonth)
      yes.finalize(0)

      const no = new Event('no', 'no')
      no.proposeDate(ts.tomorrow)
      no.proposeDate(ts.nextWeek)

      assert.isTrue(yes.matches({ finalized: true }))
      assert.isFalse(no.matches({ finalized: true }))
    })

    it('matches by unfinalized status', function () {
      const yes = new Event('yes', 'yes')
      yes.proposeDate(ts.now)
      yes.proposeDate(ts.nextMonth)

      const no = new Event('no', 'no')
      no.proposeDate(ts.tomorrow)
      no.proposeDate(ts.nextWeek)
      no.finalize(1)

      assert.isTrue(yes.matches({ unfinalized: true }))
      assert.isFalse(no.matches({ unfinalized: true }))
    })

    it('matches by invite list', function () {
      const yes = new Event('yes', 'yes')
      yes.invite(u.frey)
      yes.invite(u.fenris)

      const no = new Event('no', 'no')
      no.invite(u.fenris)

      assert.isTrue(yes.matches({ invited: u.frey }))
      assert.isFalse(no.matches({ invited: u.frey }))
    })

    it('always matches the empty filter', function () {
      const empty = new Event('empty', 'empty')

      const proposed = new Event('proposed', 'proposed')
      proposed.proposeDate(ts.now)
      proposed.proposeDate(ts.tomorrow)

      const finalized = new Event('finalized', 'finalized')
      finalized.proposeDate(ts.now)
      finalized.finalize(0)

      assert.isTrue(empty.matches({}))
      assert.isTrue(proposed.matches({}))
      assert.isTrue(finalized.matches({}))
    })
  })
})
