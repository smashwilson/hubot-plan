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
    await bot.say('me', 'event create --name "Wizard People" --id ABC')
    assert.deepEqual(bot.response(), {
      text: 'The event "Wizard People" has been created with id *ABC*.',
      attachments: [{
        fallback: 'ABC: Wizard People',
        title: 'Wizard People _ABC_',
        fields: [
          { title: 'Proposed Dates', value: '_none yet_' }
        ]
      }]
    })
  })

  it('proposes initial dates')
  it('adds initial invitees')
  it('creates an immediately finalized event')
})
