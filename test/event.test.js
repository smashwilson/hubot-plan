/* eslint-env mocha */

const assert = require('chai').assert
const moment = require('moment-timezone')

const {Event} = require('../lib/event')

describe('Event', function () {
  const now = moment.tz('2017-11-18', moment.ISO_8601, 'America/New_York')

  const tomorrow = moment.tz('2017-11-19', moment.ISO_8601, 'America/New_York')
  const nextWeek = moment.tz('2017-11-25', moment.ISO_8601, 'America/New_York')
  const nextMonth = moment.tz('2017-12-16', moment.ISO_8601, 'America/New_York')

  describe('in the proposed state', function () {
    let evt

    beforeEach(function () {
      evt = new Event('AAA', "Party at Frey's House")
      evt.proposeDate(tomorrow)
    })

    it('adds proposed dates', function () {
      evt.proposeDate(nextWeek)

      assert.deepEqual(evt.proposalKeys(), [0, 1])
      assert.equal(evt.proposal(0).date(), tomorrow)
      assert.equal(evt.proposal(1).date(), nextWeek)
    })

    it('removes proposed dates', function () {
      evt.proposeDate(nextMonth)

      evt.unpropose(0)

      assert.deepEqual(evt.proposalKeys(), [1])
      assert.equal(evt.proposal(1).date(), nextMonth)
      assert.throws(() => evt.proposal(0), 'Invalid proposed date')
    })

    it('adds invitees', function () {
      evt.invite('frey')
      evt.invite('fenris')

      assert.deepEqual(evt.getInvitees(), ['frey', 'fenris'])
    })

    it('removes invitees', function () {
      evt.invite('frey')
      evt.invite('hubot')
      evt.invite('fenris')

      evt.uninvite('hubot')

      assert.deepEqual(evt.getInvitees(), ['frey', 'fenris'])
    })

    it('tracks which invitees accept or reject proposed dates', function () {
      evt.invite('frey')
      evt.invite('fenris')
      evt.invite('reostra')

      evt.proposeDate(nextWeek)
      evt.proposeDate(nextMonth)

      assert.equal(evt.proposal(0).date(), tomorrow)
      assert.equal(evt.proposal(0).yesCount(), 0)
      assert.isFalse(evt.proposal(0).isLeading())
      assert.equal(evt.proposal(1).date(), nextWeek)
      assert.equal(evt.proposal(1).yesCount(), 0)
      assert.isFalse(evt.proposal(1).isLeading())
      assert.equal(evt.proposal(2).date(), nextMonth)
      assert.equal(evt.proposal(2).yesCount(), 0)
      assert.isFalse(evt.proposal(2).isLeading())

      evt.acceptProposal('frey', 0)
      evt.acceptProposal('fenris', 0)
      evt.acceptProposal('fenris', 1)
      evt.acceptProposal('reostra', 0)
      evt.acceptProposal('reostra', 1)
      evt.acceptProposal('reostra', 2)

      assert.equal(evt.proposal(0).date(), tomorrow)
      assert.equal(evt.proposal(0).yesCount(), 3)
      assert.isTrue(evt.proposal(0).isLeading())
      assert.equal(evt.proposal(1).date(), nextWeek)
      assert.equal(evt.proposal(1).yesCount(), 2)
      assert.isFalse(evt.proposal(1).isLeading())
      assert.equal(evt.proposal(2).date(), nextMonth)
      assert.equal(evt.proposal(2).yesCount(), 1)
      assert.isFalse(evt.proposal(2).isLeading())
    })

    describe('becoming finalized', function () {
      beforeEach(function () {
        evt.invite('frey')
        evt.invite('fenris')
        evt.invite('reostra')

        evt.proposeDate(nextWeek)
        evt.proposeDate(nextMonth)

        evt.acceptProposal('frey', 0)
        evt.acceptProposal('fenris', 0)
        evt.acceptProposal('fenris', 1)
        evt.acceptProposal('reostra', 0)
        evt.acceptProposal('reostra', 1)
        evt.acceptProposal('reostra', 2)
      })

      it('transitions invitees to yes or no based on their response to the final date', function () {
        evt.finalize(1)

        assert.isFalse(evt.finalProposal().isAttending('frey'))
        assert.isTrue(evt.finalProposal().isAttending('fenris'))
        assert.isTrue(evt.finalProposal().isAttending('reostra'))
      })
    })
  })

  describe('in the finalized state', function () {
    let evt

    beforeEach(function () {
      evt = new Event('BBB', "Party at Frey's House")
      evt.proposeDate(tomorrow)
      evt.proposeDate(nextWeek)
      evt.proposeDate(nextMonth)
      evt.invite('frey')
      evt.invite('fenris')

      evt.acceptProposal('fenris', 2)

      evt.finalize(0)
    })

    it('adds invitees', function () {
      evt.invite('reostra')

      assert.deepEqual(evt.getInvitees(), ['frey', 'fenris', 'reostra'])
    })

    it('removes invitees', function () {
      evt.uninvite('fenris')

      assert.deepEqual(evt.getInvitees(), ['frey'])
    })

    it('tracks which invitees confirm or deny', function () {
      assert.isFalse(evt.finalProposal().isAttending('frey'))
      assert.isFalse(evt.finalProposal().isAttending('fenris'))
      assert.isFalse(evt.finalProposal().isAttending('reostra'))

      evt.finalProposal().yes('fenris')
      evt.finalProposal().yes('reostra')

      assert.isFalse(evt.finalProposal().isAttending('frey'))
      assert.isTrue(evt.finalProposal().isAttending('fenris'))
      assert.isTrue(evt.finalProposal().isAttending('reostra'))
    })

    describe('changing the finalized date', function () {
      it('resets invitee confirmation', function () {
        evt.finalProposal().yes('fenris')
        evt.finalProposal().yes('reostra')

        evt.finalize(1)

        assert.isFalse(evt.finalProposal().isAttending('frey'))
        assert.isFalse(evt.finalProposal().isAttending('fenris'))
        assert.isFalse(evt.finalProposal().isAttending('reostra'))
      })

      it('respects original proposal responses', function () {
        evt.finalProposal().yes('reostra')
        evt.finalProposal().yes('frey')

        evt.finalize(2)

        assert.isFalse(evt.finalProposal().isAttending('frey'))
        assert.isTrue(evt.finalProposal().isAttending('fenris'))
        assert.isFalse(evt.finalProposal().isAttending('reostra'))
      })
    })
  })

  describe('asAttachment', function () {
    let evt

    beforeEach(function () {
      evt = new Event('BBB', "Party at Frey's House")
    })

    it('always includes the title and empty proposed dates field', function () {
      const a = evt.asAttachment(now)

      assert.equal(a.fallback, "BBB: Party at Frey's House")
      assert.equal(a.title, "BBB :calendar: Party at Frey's House")
      assert.deepEqual(a.fields, [{title: 'Proposed Dates', value: '_none yet_'}])
      assert.deepEqual(a.mrkdwn_in, ['fields'])
    })

    it('lists proposed dates', function () {
      evt.proposeDate(tomorrow)
      evt.proposeDate(nextWeek)

      const a = evt.asAttachment(now)
      assert.deepEqual(a.fields, [{
        title: 'Proposed Dates',
        value: '[0] 19 November 2017 _in a day_\n[1] 25 November 2017 _in 7 days_'
      }])
    })
  })
})
