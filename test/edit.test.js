/* eslint-env mocha */

const {BotContext, ts} = require('./bot-context')
const assert = require('chai').assert

describe('event edit', function () {
  let bot

  beforeEach(async function () {
    bot = new BotContext()
    bot.createUser('U0', 'user0')
    bot.createUser('U1', 'user1')
    bot.createUser('U2', 'user2')

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

  it('shows the current state of the event', async function () {
    await bot.say('user0', 'hubot: event AAA111')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
              '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square: <@U0> | :white_square: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('adds a new proposed date to an event', async function () {
    await bot.say('user0', 'hubot: event AAA111 --propose 2017-11-20')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
              '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_\n' +
              '[2] <!date^1511164800^{date}|20 November 2017> _in 2 days_ x1'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square_button: <@U0> | :white_square: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('removes a proposed date from an event', async function () {
    await bot.say('user0', 'hubot: event AAA111 --unpropose 0')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value: '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square: <@U0> | :white_square: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('invites someone new', async function () {
    await bot.say('user0', 'hubot: event AAA111 --invite @user2')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
              '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square: <@U0> | :white_square: <@U1> | :white_square: <@U2>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('uninvites someone', async function () {
    await bot.say('user0', 'hubot: event AAA111 --uninvite @user1')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
              '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square: <@U0>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('changes its name', async function () {
    await bot.say('user0', 'hubot: event AAA111 --name "Something Less Cool"')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Less Cool',
        title: 'AAA111 :calendar: Something Less Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
              '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square: <@U0> | :white_square: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('confirms proposed dates', async function () {
    await bot.say('user0', 'hubot: event AAA111 --yes 0')
    assert.equal(
      bot.response(),
      'You have confirmed that you would be able to attend "Something Cool" on *19 November 2017*.'
    )

    await bot.say('user0', 'hubot: event AAA111')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] <!date^1511078400^{date}|19 November 2017> _in a day_ x1\n' +
              '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square_button: <@U0> | :white_square: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('complains if the proposed date index is omitted', async function () {
    await bot.say('user0', 'hubot: event AAA111 --yes')
    assert.equal(bot.response(), ':rotating_light: Event "Something Cool" has not had a final date chosen yet.')
  })

  it('rejects proposed dates', async function () {
    await bot.say('user0', 'hubot: event AAA111 --no 1')
    assert.equal(
      bot.response(),
      'You have confirmed that you would not be able to attend "Something Cool" on *25 November 2017*.'
    )

    await bot.say('user0', 'hubot: event AAA111')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
              '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square_button: <@U0> | :white_square: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('rejects all proposed dates at once', async function () {
    await bot.say('user0', 'hubot: event AAA111 --no')
    assert.equal(
      bot.response(),
      'You have confirmed that you would not be able to attend "Something Cool"' +
      ' on *19 November 2017* or *25 November 2017*.'
    )

    await bot.say('user0', 'hubot: event AAA111')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
              '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square_button: <@U0> | :white_square: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('confirms proposed dates on behalf of someone else', async function () {
    await bot.say('user0', 'hubot: event AAA111 --for @user1 --yes 1')
    assert.equal(
      bot.response(),
      'You have confirmed that <@U1> would be able to attend "Something Cool" on *25 November 2017*.'
    )

    await bot.say('user0', 'hubot: event AAA111')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
              '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_ x1'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square: <@U0> | :white_square_button: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('rejects proposed dates on behalf of someone else', async function () {
    await bot.say('user0', 'hubot: event AAA111 --for @user1 --no 1')
    assert.equal(
      bot.response(),
      'You have confirmed that <@U1> would not be able to attend "Something Cool" on *25 November 2017*.'
    )

    await bot.say('user0', 'hubot: event AAA111')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'Proposed Dates',
            value:
              '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
              '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
          },
          {
            title: 'Who',
            value: '_Responses_\n:white_square: <@U0> | :white_square_button: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('finalizes an unfinalized event', async function () {
    await bot.say('user0', 'hubot: event AAA111 --finalize 0')
    assert.deepEqual(bot.response(), {
      attachments: [{
        fallback: 'AAA111: Something Cool',
        title: 'AAA111 :calendar: Something Cool',
        fields: [
          {
            title: 'When',
            value: '<!date^1511078400^{date}|19 November 2017> _in a day_'
          },
          {
            title: 'Who',
            value: '_Attendees_\n:grey_question: <@U0> | :grey_question: <@U1>'
          }
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  describe('on a finalized event', function () {
    beforeEach(async function () {
      await bot.withStore(store => {
        const e = store.lookup('AAA111')
        e.finalize(1)
      })
    })

    it('confirms attendance', async function () {
      await bot.say('user0', 'hubot: event AAA111 --yes')
      assert.equal(
        bot.response(),
        'You have confirmed that you will be able to attend "Something Cool" on *25 November 2017*.'
      )

      await bot.say('user0', 'hubot: event AAA111')
      assert.deepEqual(
        bot.response(),
        {attachments: [
          {
            fallback: 'AAA111: Something Cool',
            title: 'AAA111 :calendar: Something Cool',
            fields: [
              {
                title: 'When',
                value: '<!date^1511596800^{date}|25 November 2017> _in 7 days_'
              },
              {
                title: 'Who',
                value: '_Attendees_\n:white_check_mark: <@U0> | :grey_question: <@U1>'
              }
            ],
            mrkdwn_in: ['fields']
          }
        ]}
      )
    })

    it('rejects attendance', async function () {
      await bot.say('user0', 'hubot: event AAA111 --no')
      assert.equal(
        bot.response(),
        'You have confirmed that you will not be able to attend "Something Cool" on *25 November 2017*.'
      )

      await bot.say('user0', 'hubot: event AAA111')
      assert.deepEqual(
        bot.response(),
        {attachments: [
          {
            fallback: 'AAA111: Something Cool',
            title: 'AAA111 :calendar: Something Cool',
            fields: [
              {
                title: 'When',
                value: '<!date^1511596800^{date}|25 November 2017> _in 7 days_'
              },
              {
                title: 'Who',
                value: '_Attendees_\n:red_circle: <@U0> | :grey_question: <@U1>'
              }
            ],
            mrkdwn_in: ['fields']
          }
        ]}
      )
    })

    it('confirms on behalf of someone else', async function () {
      await bot.say('user0', 'hubot: event AAA111 --for user1 --yes')
      assert.equal(
        bot.response(),
        'You have confirmed that <@U1> will be able to attend "Something Cool" on *25 November 2017*.'
      )

      await bot.say('user0', 'hubot: event AAA111')
      assert.deepEqual(
        bot.response(),
        {attachments: [
          {
            fallback: 'AAA111: Something Cool',
            title: 'AAA111 :calendar: Something Cool',
            fields: [
              {
                title: 'When',
                value: '<!date^1511596800^{date}|25 November 2017> _in 7 days_'
              },
              {
                title: 'Who',
                value: '_Attendees_\n:grey_question: <@U0> | :white_check_mark: <@U1>'
              }
            ],
            mrkdwn_in: ['fields']
          }
        ]}
      )
    })

    it('rejects on behalf of someone else', async function () {
      await bot.say('user0', 'hubot: event AAA111 --for user1 --no')
      assert.equal(
        bot.response(),
        'You have confirmed that <@U1> will not be able to attend "Something Cool" on *25 November 2017*.'
      )

      await bot.say('user0', 'hubot: event AAA111')
      assert.deepEqual(
        bot.response(),
        {attachments: [
          {
            fallback: 'AAA111: Something Cool',
            title: 'AAA111 :calendar: Something Cool',
            fields: [
              {
                title: 'When',
                value: '<!date^1511596800^{date}|25 November 2017> _in 7 days_'
              },
              {
                title: 'Who',
                value: '_Attendees_\n:grey_question: <@U0> | :red_circle: <@U1>'
              }
            ],
            mrkdwn_in: ['fields']
          }
        ]}
      )
    })

    it('cannot be re-finalized without being unfinalized first', async function () {
      await bot.say('user0', 'hubot: event AAA111 --finalize 0')
      assert.equal(bot.response(), ':rotating_light: Event "Something Cool" has already had a final date chosen.')
    })

    it('may be unfinalized', async function () {
      await bot.say('user0', 'hubot: event AAA111 --unfinalize')
      assert.deepEqual(bot.response(), {
        text: 'The event "Something Cool" may now have its final date reassigned.',
        attachments: [{
          fallback: 'AAA111: Something Cool',
          title: 'AAA111 :calendar: Something Cool',
          fields: [
            {
              title: 'Proposed Dates',
              value:
                '[0] <!date^1511078400^{date}|19 November 2017> _in a day_\n' +
                '[1] <!date^1511596800^{date}|25 November 2017> _in 7 days_'
            },
            {
              title: 'Who',
              value: '_Responses_\n:white_square: <@U0> | :white_square: <@U1>'
            }
          ],
          mrkdwn_in: ['fields']
        }]
      })
    })
  })
})
