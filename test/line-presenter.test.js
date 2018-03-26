/* eslint-env mocha */

const assert = require('chai').assert
const {ts} = require('./bot-context')

const {Event} = require('../lib/event')
const {LinePresenter} = require('../lib/line-presenter')

describe('LinePresenter', function () {
  let evt

  beforeEach(function () {
    evt = new Event('ZZZ999', 'Wizard People')
  })

  describe('with an unfinalized event', function () {
    it('renders no proposed dates', function () {
      const p = new LinePresenter({})
      const line = p.present(evt)
      assert.strictEqual(line, '`ZZZ999` _Wizard People_')
    })

    it('renders multiple proposed dates', function () {
      evt.proposeDate(ts.tomorrow)
      evt.proposeDate(ts.nextWeek)

      const p = new LinePresenter({})
      const line = p.present(evt)
      assert.strictEqual(
        line,
        '`ZZZ999` _Wizard People_ ' +
        '<!date^1511078400^{date}|19 November 2017>, <!date^1511596800^{date}|25 November 2017>'
      )
    })
  })

  it('renders a finalized event', function () {
    evt.proposeDate(ts.tomorrow)
    evt.proposeDate(ts.nextWeek)
    evt.finalize(1)

    const p = new LinePresenter({})
    const line = p.present(evt)
    assert.strictEqual(
      line,
      '`ZZZ999` Wizard People <!date^1511596800^{date}|25 November 2017>'
    )
  })
})
