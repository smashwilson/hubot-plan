/* eslint-env mocha */

const assert = require('chai').assert

const {EventStore} = require('../lib/event-store')
const {Event} = require('../lib/event')

describe('EventStore', function () {
  let store

  beforeEach(function () {
    store = new EventStore()
  })

  it('assigns each event a unique ID on insertion', function () {
    const e = new Event('A')
    const id = store.insert(e)
    assert.isDefined(id)
    assert.match(id, /[A-Z0-9]{8}/)
  })

  it('accesses events by ID', function () {
    const e = new Event('B')
    const id = store.insert(e)
    const out = store.lookup(id)
    assert.equal(out.getName(), 'B')
  })

  it('throws an error for invalid IDs', function () {
    assert.throws(() => store.lookup('NOPENO00'), 'Invalid event ID')
  })
})
