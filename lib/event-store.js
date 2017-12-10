const {Event} = require('./event')
const {buildInvalidEventError} = require('./errors')

const a = 'A'.codePointAt(0)
const z = 'Z'.codePointAt(0)
const zero = '0'.codePointAt(0)

function generateID () {
  const codePoints = []
  for (let i = 0; i < 8; i++) {
    const choice = Math.floor(Math.random() * ((z + 9) - a + 1)) + a
    codePoints.push(choice <= z ? choice : zero + (choice - z))
  }
  return String.fromCodePoint(...codePoints)
}

class EventStore {
  constructor () {
    this.byID = new Map()
  }

  create (id, ...args) {
    if (!id) {
      id = generateID()
      while (this.byID.has(id)) {
        id = generateID()
      }
    }

    const evt = new Event(id, ...args)
    this.byID.set(id, evt)
    return evt
  }

  lookup (id) {
    const e = this.byID.get(id)
    if (e === undefined) {
      throw buildInvalidEventError({eventID: id})
    }
    return e
  }

  delete (id) {
    if (!this.byID.delete(id)) {
      throw buildInvalidEventError({eventID: id})
    }
  }

  serialize () {
    return {
      byID: Array.from(this.byID, pair => [pair[0], pair[1].serialize()])
    }
  }

  static deserialize (payload) {
    const s = new EventStore()
    s.byID = new Map(
      payload.byID.map(pair => [pair[0], Event.deserialize(pair[1])])
    )
    return s
  }
}

module.exports = {EventStore}
