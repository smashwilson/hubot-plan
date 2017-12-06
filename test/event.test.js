/* eslint-env mocha */

const assert = require('chai').assert

const {ts} = require('./bot-context')
const {Event} = require('../lib/event')

describe('Event', function () {
  describe('in the proposed state', function () {
    let evt

    beforeEach(function () {
      evt = new Event('AAA', "Party at Frey's House")
      evt.proposeDate(ts.tomorrow)
    })

    it('adds proposed dates', function () {
      evt.proposeDate(ts.nextWeek)

      assert.deepEqual(evt.proposalKeys(), [0, 1])
      assert.equal(evt.proposal(0).date(), ts.tomorrow)
      assert.equal(evt.proposal(1).date(), ts.nextWeek)
    })

    it('removes proposed dates', function () {
      evt.proposeDate(ts.nextMonth)

      evt.unpropose(0)

      assert.deepEqual(evt.proposalKeys(), [1])
      assert.equal(evt.proposal(1).date(), ts.nextMonth)
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

      evt.proposeDate(ts.nextWeek)
      evt.proposeDate(ts.nextMonth)

      assert.equal(evt.proposal(0).date(), ts.tomorrow)
      assert.equal(evt.proposal(0).yesCount(), 0)
      assert.isFalse(evt.proposal(0).isLeading())
      assert.equal(evt.proposal(1).date(), ts.nextWeek)
      assert.equal(evt.proposal(1).yesCount(), 0)
      assert.isFalse(evt.proposal(1).isLeading())
      assert.equal(evt.proposal(2).date(), ts.nextMonth)
      assert.equal(evt.proposal(2).yesCount(), 0)
      assert.isFalse(evt.proposal(2).isLeading())

      evt.acceptProposal('frey', 0)
      evt.acceptProposal('fenris', 0)
      evt.acceptProposal('fenris', 1)
      evt.acceptProposal('reostra', 0)
      evt.acceptProposal('reostra', 1)
      evt.acceptProposal('reostra', 2)

      assert.equal(evt.proposal(0).date(), ts.tomorrow)
      assert.equal(evt.proposal(0).yesCount(), 3)
      assert.isTrue(evt.proposal(0).isLeading())
      assert.equal(evt.proposal(1).date(), ts.nextWeek)
      assert.equal(evt.proposal(1).yesCount(), 2)
      assert.isFalse(evt.proposal(1).isLeading())
      assert.equal(evt.proposal(2).date(), ts.nextMonth)
      assert.equal(evt.proposal(2).yesCount(), 1)
      assert.isFalse(evt.proposal(2).isLeading())
    })

    describe('becoming finalized', function () {
      beforeEach(function () {
        evt.invite('frey')
        evt.invite('fenris')
        evt.invite('reostra')

        evt.proposeDate(ts.nextWeek)
        evt.proposeDate(ts.nextMonth)

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
      evt.proposeDate(ts.tomorrow)
      evt.proposeDate(ts.nextWeek)
      evt.proposeDate(ts.nextMonth)
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
      const a = evt.asAttachment(ts.now)

      assert.equal(a.fallback, "BBB: Party at Frey's House")
      assert.equal(a.title, "BBB :calendar: Party at Frey's House")
      assert.deepEqual(a.fields, [{title: 'Proposed Dates', value: '_none yet_'}])
      assert.deepEqual(a.mrkdwn_in, ['fields'])
    })

    it('lists proposed dates', function () {
      evt.proposeDate(ts.tomorrow)
      evt.proposeDate(ts.nextWeek)

      const a = evt.asAttachment(ts.now)
      assert.deepEqual(a.fields, [{
        title: 'Proposed Dates',
        value: '[0] 19 November 2017 _in a day_\n[1] 25 November 2017 _in 7 days_'
      }])
    })

    it('lists attendees and current response status', function () {
      evt.proposeDate(ts.tomorrow)
      evt.proposeDate(ts.nextWeek)

      // U123 has not responded yet
      evt.invite('<@U123>')

      // U456 can make tomorrow
      evt.invite('<@U456>')
      evt.acceptProposal('<@U456>', 0)

      // U789 can't make it
      evt.invite('<@U789>')
      evt.rejectProposal('<@U789>', 0)
      evt.rejectProposal('<@U789>', 1)

      // U111 can make it, but wasn't on the initial invite list
      evt.acceptProposal('<@U111>', 1)

      const a = evt.asAttachment(ts.now)
      assert.deepEqual(a.fields, [
        {
          title: 'Proposed Dates',
          value:
            '[0] 19 November 2017 _in a day_ :medal: x1\n' +
            '[1] 25 November 2017 _in 7 days_ :medal: x1'
        },
        {
          title: 'Who',
          value:
            ':white_square: <@U123> | :white_square_button: <@U456> | ' +
            ':white_square_button: <@U789> | :white_square_button: <@U111>'
        }
      ])
    })
  })

  it('serializes and deserializes itself', function () {
    const evt0 = new Event('BBB', "Party at Frey's House")

    evt0.proposeDate(ts.tomorrow)
    evt0.proposeDate(ts.nextWeek)
    evt0.invite('<@U123>')
    evt0.invite('<@U456>')
    evt0.acceptProposal('<@U456>', 0)
    evt0.invite('<@U789>')
    evt0.rejectProposal('<@U789>', 0)
    evt0.rejectProposal('<@U789>', 1)
    evt0.acceptProposal('<@U111>', 1)

    const payload = evt0.serialize()
    const evt1 = Event.deserialize(payload)

    assert.equal(evt1.getName(), "Party at Frey's House")
    assert.deepEqual(evt1.proposalKeys(), [0, 1])
    assert.equal(evt1.proposal(0).date().valueOf(), ts.tomorrow.valueOf())
    assert.equal(evt1.proposal(1).date().valueOf(), ts.nextWeek.valueOf())
    assert.deepEqual(evt1.getInvitees(), ['<@U123>', '<@U456>', '<@U789>', '<@U111>'])
  })
})
