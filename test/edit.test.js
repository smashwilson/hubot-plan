/* eslint-env mocha */

const {BotContext, ts} = require('./bot-context')
const assert = require('chai').assert

describe('event edit', function () {
  let bot

  beforeEach(async function () {
    bot = new BotContext()

    await bot.withStore(store => {
      const e = store.create('AAA111', 'Something Cool')
      e.proposeDate(ts.tomorrow)
      e.proposeDate(ts.nextWeek)
      e.invite('<@U0>')
      e.invite('<@U1>')
    })
  })

  afterEach(function () {
    bot.cleanup()
  })

  it('adds a new proposed date to an event', async function () {
    await bot.say('me', 'hubot: event AAA111 --propose 2017-11-20')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] 19 November 2017 _in a day_\n' +
              '[1] 25 November 2017 _in 7 days_\n' +
              '[2] 20 November 2017 _in 2 days_'
          },
          {
            title: 'Who',
            value: ':white_square: <@U0> | :white_square: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('removes a proposed date from an event')

  it('invites someone new')

  it('uninvites someone')

  it('changes its name')

  it('confirms proposed dates')

  it('rejects proposed dates')

  it('confirms proposed dates on behalf of someone else')

  it('rejects proposed dates on behalf of someone else')
})
