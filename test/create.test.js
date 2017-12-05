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

  it('adds initial invitees')
  it('creates an immediately finalized event')
})