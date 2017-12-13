/* eslint-env mocha */

const assert = require('chai').assert

const {EventStore} = require('../lib/event-store')
const {ts} = require('./bot-context')

describe('EventStore', function () {
  let store

  beforeEach(function () {
    store = new EventStore()
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

  it('throws an error for invalid IDs', function () {
    assert.throws(() => store.lookup('NOPENO00'), 'Invalid event ID')
  })

  it('deletes events by ID', function () {
    const e1 = store.create('111', 'A')
    const e2 = store.create('222', 'B')

    assert.equal(store.lookup('111'), e1)
    assert.equal(store.lookup('222'), e2)

    store.delete('222')

    assert.equal(store.lookup('111'), e1)
    assert.throws(() => store.lookup('222'), 'Invalid event ID')
  })

  it('serializes and deserializes itself', function () {
    store.create('111', 'A')
    store.create('222', 'B')
    store.create('333', 'C')

    const payload = store.serialize()
    const store1 = EventStore.deserialize(payload)

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
    no0.invite('u0')

    // Defeated by invitation filter
    const no1 = store.create('2', 'B')
    no1.proposeDate(ts.nextWeek)
    no1.invite('u1')

    // Included
    const yes0 = store.create('3', 'C')
    yes0.proposeDate(ts.nextMonth)
    yes0.invite('u0')

    // Included
    const yes1 = store.create('4', 'D')
    yes1.proposeDate(ts.nextWeek)
    yes1.invite('u0')

    // Defaulted by "before" filter
    const no2 = store.create('5', 'E')
    no2.proposeDate(ts.nextYear)
    no2.invite('u0')

    const results = store.search({
      after: ts.nextWeek.getStart(),
      before: ts.nextMonth.getStart(),
      invited: 'u0'
    })
    assert.equal(results.size(), 2)
    assert.equal(results.at(0), yes1)
    assert.equal(results.at(1), yes0)
  })
})
