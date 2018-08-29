/* eslint-env mocha */

const assert = require('chai').assert

const { EventStore } = require('../lib/event-store')
const { Invitee } = require('../lib/invitee')
const { ts, BotContext } = require('./bot-context')

describe('EventStore', function () {
  let store, bot

  beforeEach(function () {
    bot = new BotContext()

    bot.createUser('u0', 'user0', 'user0@gmail.com')
    bot.createUser('u1', 'user1', 'user1@gmail.com')
    bot.createUser('u2', 'user2', 'user2@gmail.com')
    bot.createUser('u3', 'user3', 'user3@gmail.com')

    store = new EventStore(bot.room.robot)
  })

  afterEach(function () {
    bot.cleanup()
  })

  it('assigns each event a unique ID on insertion', function () {
    const e = store.create(null, 'A')
    assert.equal(e.getName(), 'A')
    assert.match(e.getID(), /[A-Z0-9]{8}/)
  })

  it('optionally specifies a fixed ID', function () {
    const e = store.create('123', 'A')
    assert.equal(e.getID(), '123')
  })

  it('accesses events by ID', function () {
    const e = store.create(null, 'B')
    const out = store.lookup(e.getID())
    assert.equal(out.getName(), 'B')
  })

  it('is case-insensitive for IDs', function () {
    store.create('AAA', 'the event')
    const out = store.lookup('aaa')
    assert.equal(out.getName(), 'the event')
  })

  it('throws an error for invalid IDs', function () {
    assert.throws(() => store.lookup('NOPENO00'), 'Invalid event ID')
  })

  it('deletes events by case-insensitive ID', function () {
    const e1 = store.create('111X', 'A')
    const e2 = store.create('222Y', 'B')

    assert.equal(store.lookup('111X'), e1)
    assert.equal(store.lookup('222Y'), e2)

    store.delete('222y')

    assert.equal(store.lookup('111X'), e1)
    assert.throws(() => store.lookup('222Y'), 'Invalid event ID')
  })

  it('serializes and deserializes itself', function () {
    store.create('111', 'A')
    store.create('222', 'B')
    store.create('333', 'C')

    const payload = store.serialize()
    const t = JSON.parse(JSON.stringify(payload))
    const store1 = EventStore.deserialize(bot.robot, t)

    const a1 = store1.lookup('111')
    const b1 = store1.lookup('222')
    const c1 = store1.lookup('333')

    assert.equal(a1.getName(), 'A')
    assert.equal(b1.getName(), 'B')
    assert.equal(c1.getName(), 'C')
  })

  it('produces an EventSet of Events matching a filter', function () {
    // Defeated by "after" filter
    const no0 = store.create('1', 'A')
    no0.proposeDate(ts.now)
    no0.proposeDate(ts.tomorrow)
    no0.invite(Invitee.withUID('u0'))

    // Defeated by invitation filter
    const no1 = store.create('2', 'B')
    no1.proposeDate(ts.nextWeek)
    no1.invite(Invitee.withUID('u1'))

    // Included
    const yes0 = store.create('3', 'C')
    yes0.proposeDate(ts.nextMonth)
    yes0.invite(Invitee.withUID('u0'))

    // Included
    const yes1 = store.create('4', 'D')
    yes1.proposeDate(ts.nextWeek)
    yes1.invite(Invitee.withUID('u0'))

    // Defaulted by "before" filter
    const no2 = store.create('5', 'E')
    no2.proposeDate(ts.nextYear)
    no2.invite(Invitee.withUID('u0'))

    const results = store.search({
      after: ts.nextWeek.getStart(),
      before: ts.nextMonth.getStart(),
      invited: Invitee.withUID('u0')
    })
    assert.equal(results.size(), 2)
    assert.equal(results.at(0), yes1)
    assert.equal(results.at(1), yes0)
  })

  it('renders an EventSet as an iCal feed', function () {
    const e0 = store.create('ABC', 'Set In Stone')
    e0.proposeDate(ts.tomorrow)
    e0.proposeDate(ts.nextWeek)
    e0.invite(Invitee.withUID('u1'))
    e0.invite(Invitee.withUID('u2'))
    e0.invite(Invitee.withUID('u3'))
    e0.acceptProposal(Invitee.withUID('u1'), 0)
    e0.acceptProposal(Invitee.withUID('u1'), 1)
    e0.acceptProposal(Invitee.withUID('u2'), 0)
    e0.acceptProposal(Invitee.withUID('u3'), 1)
    e0.finalize(1)

    const e1 = store.create('DEF', 'Planned')
    e1.proposeDate(ts.nextWeek)
    e1.proposeDate(ts.nextMonth)
    e1.proposeDate(ts.nextYear)
    e1.invite(Invitee.withUID('u1'))
    e1.invite(Invitee.withUID('u2'))
    e1.invite(Invitee.withUID('u3'))
    e1.acceptProposal(Invitee.withUID('u1'), 0)
    e1.acceptProposal(Invitee.withUID('u1'), 2)
    e1.acceptProposal(Invitee.withUID('u2'), 0)
    e1.acceptProposal(Invitee.withUID('u2'), 1)
    e1.acceptProposal(Invitee.withUID('u2'), 2)
    e1.acceptProposal(Invitee.withUID('u3'), 1)
    e1.acceptProposal(Invitee.withUID('u3'), 2)

    // Render iCal feed
    const ical = store.search({}).renderICal('Upcoming Events', 'America/Los_Angeles')

    assert.match(ical, /SUMMARY:Set In Stone/)
    assert.match(ical, /SUMMARY:Planned/)
  })
})
