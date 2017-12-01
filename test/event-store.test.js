/* eslint-env mocha */

const assert = require('chai').assert

const {EventStore} = require('../lib/event-store')

describe('EventStore', function () {
  let store

  beforeEach(function () {
    store = new EventStore()
  })

  it('assigns each event a unique ID on insertion', function () {
    const e = store.create('A')
    assert.equal(e.getName(), 'A')
    assert.match(e.getID(), /[A-Z0-9]{8}/)
  })

  it('accesses events by ID', function () {
    const e = store.create('B')
    const out = store.lookup(e.getID())
    assert.equal(out.getName(), 'B')
  })

  it('throws an error for invalid IDs', function () {
    assert.throws(() => store.lookup('NOPENO00'), 'Invalid event ID')
  })
})
