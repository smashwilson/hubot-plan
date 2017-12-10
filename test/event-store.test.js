/* eslint-env mocha */

const assert = require('chai').assert

const {EventStore} = require('../lib/event-store')

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
})
