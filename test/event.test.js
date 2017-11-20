/* eslint-env mocha */

const assert = require('chai').assert
const moment = require('moment-timezone')

const {Event} = require('../lib/event')

describe('Event', function () {
  const tomorrow = moment.tz('2017-11-19', moment.ISO_8601, 'America/New_York')
  const nextWeek = moment.tz('2017-11-25', moment.ISO_8601, 'America/New_York')
  const nextMonth = moment.tz('2017-12-16', moment.ISO_8601, 'America/New_York')

  describe('in the proposed state', function () {
    let proposed

    beforeEach(function () {
      proposed = new Event("Party at Frey's House")
      proposed.proposeDate(tomorrow)
    })

    it('adds proposed dates', function () {
      proposed.proposeDate(nextWeek)

      assert.deepEqual(proposed.proposalKeys(), [0, 1])
      assert.equal(proposed.proposal(0).date(), tomorrow)
      assert.equal(proposed.proposal(1).date(), nextWeek)
    })

    it('removes proposed dates', function () {
      proposed.proposeDate(nextMonth)

      proposed.unpropose(0)

      assert.deepEqual(proposed.proposalKeys(), [1])
      assert.equal(proposed.proposal(1).date(), nextMonth)
      assert.isFalse(proposed.proposal(0).isValid())
    })

    it('adds invitees', function () {
      proposed.invite('frey')
      proposed.invite('fenris')

      assert.deepEqual(proposed.getInvitees(), ['frey', 'fenris'])
    })

    it('removes invitees', function () {
      proposed.invite('frey')
      proposed.invite('hubot')
      proposed.invite('fenris')

      proposed.uninvite('hubot')

      assert.deepEqual(proposed.getInvitees(), ['frey', 'fenris'])
    })

    it('tracks which invitees accept or reject proposed dates', function () {
      proposed.invite('frey')
      proposed.invite('fenris')
      proposed.invite('reostra')

      proposed.proposeDate(nextWeek)
      proposed.proposeDate(nextMonth)

      assert.equal(proposed.proposal(0).date(), tomorrow)
      assert.equal(proposed.proposal(0).yesCount(), 0)
      assert.isFalse(proposed.proposal(0).isLeading())
      assert.equal(proposed.proposal(1).date(), nextWeek)
      assert.equal(proposed.proposal(1).yesCount(), 0)
      assert.isFalse(proposed.proposal(1).isLeading())
      assert.equal(proposed.proposal(2).date(), nextMonth)
      assert.equal(proposed.proposal(2).yesCount(), 0)
      assert.isFalse(proposed.proposal(2).isLeading())

      proposed.acceptProposal('frey', 0)
      proposed.acceptProposal('fenris', 0)
      proposed.acceptProposal('fenris', 1)
      proposed.acceptProposal('reostra', 0)
      proposed.acceptProposal('reostra', 1)
      proposed.acceptProposal('reostra', 2)

      assert.equal(proposed.proposal(0).date(), tomorrow)
      assert.equal(proposed.proposal(0).yesCount(), 3)
      assert.isTrue(proposed.proposal(0).isLeading())
      assert.equal(proposed.proposal(1).date(), nextWeek)
      assert.equal(proposed.proposal(1).yesCount(), 2)
      assert.isFalse(proposed.proposal(1).isLeading())
      assert.equal(proposed.proposal(2).date(), nextMonth)
      assert.equal(proposed.proposal(2).yesCount(), 1)
      assert.isFalse(proposed.proposal(2).isLeading())
    })

    describe('becoming finalized', function () {
      beforeEach(function () {
        proposed.invite('frey')
        proposed.invite('fenris')
        proposed.invite('reostra')

        proposed.proposeDate(nextWeek)
        proposed.proposeDate(nextMonth)

        proposed.acceptProposal('frey', 0)
        proposed.acceptProposal('fenris', 0)
        proposed.acceptProposal('fenris', 1)
        proposed.acceptProposal('reostra', 0)
        proposed.acceptProposal('reostra', 1)
        proposed.acceptProposal('reostra', 2)
      })

      it('transitions invitees to yes or no based on their response to the final date', function () {
        const finalized = proposed.finalize(1)

        assert.isFalse(finalized.isAttending('frey'))
        assert.isTrue(finalized.isAttending('fenris'))
        assert.isTrue(finalized.isAttending('reostra'))
      })
    })
  })

  describe('in the finalized state', function () {
    let finalized

    beforeEach(function () {
      const proposed = new Event("Party at Frey's House")
      proposed.proposeDate(tomorrow)
      proposed.proposeDate(nextWeek)
      proposed.proposeDate(nextMonth)
      proposed.invite('frey')
      proposed.invite('fenris')

      proposed.acceptProposal('fenris', 2)

      finalized = proposed.finalize(0)
    })

    it('adds invitees', function () {
      finalized.invite('reostra')

      assert.deepEqual(finalized.getInvitees(), ['frey', 'fenris', 'reostra'])
    })

    it('removes invitees', function () {
      finalized.uninvite('fenris')

      assert.deepEqual(finalized.getInvitees(), ['frey'])
    })

    it('tracks which invitees confirm or deny', function () {
      assert.isFalse(finalized.isAttending('frey'))
      assert.isFalse(finalized.isAttending('fenris'))
      assert.isFalse(finalized.isAttending('reostra'))

      finalized.yes('fenris')
      finalized.yes('reostra')

      assert.isFalse(finalized.isAttending('frey'))
      assert.isTrue(finalized.isAttending('fenris'))
      assert.isTrue(finalized.isAttending('reostra'))
    })

    describe('changing the finalized date', function () {
      it('resets invitee confirmation', function () {
        finalized.yes('fenris')
        finalized.yes('reostra')

        finalized.refinalize(1)

        assert.isFalse(finalized.isAttending('frey'))
        assert.isFalse(finalized.isAttending('fenris'))
        assert.isFalse(finalized.isAttending('reostra'))
      })

      it('respects original proposal responses', function () {
        finalized.yes('reostra')
        finalized.yes('frey')

        finalized.refinalize(2)

        assert.isFalse(finalized.isAttending('frey'))
        assert.isTrue(finalized.isAttending('fenris'))
        assert.isFalse(finalized.isAttending('reostra'))
      })
    })
  })
})
