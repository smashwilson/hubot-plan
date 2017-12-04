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
          value: '[0] 10 December 2017 _in 5 days_\n[1] 11 December 2017 _in 6 days_'
        }],
        mrkdwn_in: ['fields']
      }]
    })
  })

  it('adds initial invitees')
  it('creates an immediately finalized event')
})
