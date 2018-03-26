/* eslint-env mocha */

const assert = require('chai').assert
const {ts} = require('./bot-context')

const {Event} = require('../lib/event')
const {AttachmentPresenter} = require('../lib/attachment-presenter.js')

describe('AttachmentPresenter', function () {
  let event

  beforeEach(function () {
    event = new Event('ABC123', 'Burrito Party')
  })

  describe('with an empty event', function () {
    it('shows the title and an empty proposed dates field', function () {
      const p = new AttachmentPresenter({})
      const a = p.present(event)

      assert.equal(a.fallback, 'ABC123: Burrito Party')
      assert.equal(a.title, 'ABC123 :calendar: Burrito Party')
      assert.deepEqual(a.fields, [{title: 'Proposed Dates', value: '_none yet_'}])
      assert.deepEqual(a.mrkdwn_in, ['fields'])
    })
  })

  describe('with an unfinalized event', function () {
    beforeEach(function () {
      event.proposeDate(ts.tomorrow)
      event.proposeDate(ts.nextWeek)
    })

    it('lists proposed dates', function () {
      const p = new AttachmentPresenter({now: ts.now.getStart()})
      const a = p.present(event)

      assert.deepEqual(a.fields, [{
        title: 'Proposed Dates',
        value:
          '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
          '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
      }])
    })

    it('lists counts of attendees who have voted for each', function () {
      event.acceptProposal('<@U123>', 0)
      event.acceptProposal('<@U123>', 1)

      event.acceptProposal('<@U456>', 0)
      event.acceptProposal('<@U456>', 1)

      event.acceptProposal('<@U789>', 1)

      const p = new AttachmentPresenter({now: ts.now.getStart()})
      const a = p.present(event)

      assert.deepEqual(a.fields[0], {
        title: 'Proposed Dates',
        value:
          '[0] <!date^1511078400^{date}|19 November 2017> _in a day_ x2\n' +
          '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_ :medal: x3'
      })
    })

    it('lists invitees with response status', function () {
      event.invite('<@U000>')
      event.invite('<@U111>')
      event.acceptProposal('<@U111>', 0)
      event.acceptProposal('<@U222>', 1)

      const p = new AttachmentPresenter({now: ts.now.getStart()})
      const a = p.present(event)

      assert.deepEqual(a.fields[1], {
        title: 'Who',
        value:
          '_Responses_\n' +
          ':white_square: <@U000> | :white_square_button: <@U111> | ' +
          ':white_square_button: <@U222>'
      })
    })

    it('@-mentions users when requested')
  })

  describe('with a finalized event', function () {
    beforeEach(function () {
      event.invite('<@U000>')
      event.invite('<@U111>')
      event.invite('<@U222>')

      event.proposeDate(ts.tomorrow)
      event.proposeDate(ts.nextWeek)

      event.acceptProposal('<@U111>', 0)
      event.acceptProposal('<@U111>', 1)

      event.acceptProposal('<@U222>', 1)

      event.finalize(0)
    })

    it('shows the chosen event date', function () {
      const p = new AttachmentPresenter({now: ts.now.getStart()})
      const a = p.present(event)

      assert.deepEqual(a.fields[0], {
        title: 'When',
        value: '<!date^1511078400^{date}|19 November 2017> _in a day_'
      })
    })

    it('lists invitees with their response status', function () {
      const p = new AttachmentPresenter({now: ts.now.getStart()})
      const a = p.present(event)

      assert.deepEqual(a.fields[1], {
        title: 'Who',
        value:
          '_Attendees (1 confirmed)_\n' +
          ':grey_question: <@U000> | :white_check_mark: <@U111> | :red_circle: <@U222>'
      })
    })

    it('@-mentions users when requested')
  })
})
