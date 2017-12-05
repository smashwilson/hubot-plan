/* eslint-env mocha */

const {BotContext} = require('./bot-context')
const assert = require('chai').assert

describe('event create', function () {
  let bot

  beforeEach(function () {
    bot = new BotContext()
  })

  afterEach(function () {
    bot.cleanup()
  })

  it('creates an event with a name', async function () {
    await bot.say('me', 'hubot: event create --name "Wizard People" --id ABC')
    assert.deepEqual(bot.response(), {
      text: 'The event "Wizard People" has been created with id *ABC*.',
      attachments: [{
        fallback: 'ABC: Wizard People',
        title: 'ABC :calendar: Wizard People',
        fields: [{title: 'Proposed Dates', value: '_none yet_'}],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('proposes initial dates', async function () {
    await bot.say('me', 'hubot: event create --name "Wizard People" --id ABC --propose 2017-12-10 --propose 2017-12-11')
    assert.deepEqual(bot.response(), {
      text: 'The event "Wizard People" has been created with id *ABC*.',
      attachments: [{
        fallback: 'ABC: Wizard People',
        title: 'ABC :calendar: Wizard People',
        fields: [{
          title: 'Proposed Dates',
          value: '[0] 10 December 2017 _in 22 days_\n[1] 11 December 2017 _in 23 days_'
        }],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('reports unparsed dates', async function () {
    await bot.say('me',
      'hubot: event create --name "Wizard People" --id ABC ' +
      '--propose 2017-12-36 --propose february --propose 2017-12-12'
    )
    assert.deepEqual(bot.response(), {
      text: 'The event "Wizard People" has been created with id *ABC*.',
      attachments: [
        {
          fallback: 'ABC: Wizard People',
          title: 'ABC :calendar: Wizard People',
          fields: [{
            title: 'Proposed Dates',
            value: '[0] 12 December 2017 _in 24 days_'
          }],
          mrkdwn_in: ['fields']
        },
        {
          fallback: 'Unable to parse: 2017-12-36, february',
          title: 'Unable to parse proposed dates',
          text:
            'Please use <ISO 8601|https://en.wikipedia.org/wiki/ISO_8601> to format date arguments. ' +
            'For example, right now is `2017-11-18T05:00:00.000Z`. The time bit may be omitted for whole-day events.' +
            '\n\nI couldn\'t parse: `2017-12-36`, `february`.',
          color: 'danger',
          mrkdwn_in: ['text']
        }
      ]
    })
  })

  it('adds initial invitees', async function () {
    bot.createUser('U111', 'me')
    bot.createUser('U222', 'you')

    await bot.say('me',
      'hubot: event create --name "Foo" --id CBA --invite @you --invite me --invite unknown'
    )

    assert.deepEqual(bot.response(), {
      text: 'The event "Foo" has been created with id *CBA*.',
      attachments: [{
        fallback: 'CBA: Foo',
        title: 'CBA :calendar: Foo',
        fields: [
          {title: 'Proposed Dates', value: '_none yet_'},
          {title: 'Who', value: ':white_square: <@U222> | :white_square: <@U111> | :white_square: unknown'}
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('creates an immediately finalized event', async function () {
    bot.createUser('U1', 'you')

    await bot.say('me', 'hubot: event create --name "Bar" --id XYZ --at 2017-11-19 --invite you')
    assert.deepEqual(bot.response(), {
      text: 'The event "Bar" has been created with id *XYZ*.',
      attachments: [{
        fallback: 'XYZ: Bar',
        title: 'XYZ :calendar: Bar',
        fields: [
          {title: 'When', value: '19 November 2017 _in a day_'},
          {title: 'Who', value: ':grey_question: <@U1>'}
        ],
        mrkdwn_in: ['fields']
      }]
    })
  })
})
