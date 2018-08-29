const { Event } = require('./event')
const { EventSet } = require('./event-set')
const { buildInvalidEventError } = require('./errors')

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
  constructor (robot) {
    this.robot = robot
    this.byID = new Map()
  }

  create (id, ...args) {
    if (!id) {
      id = generateID()
      while (this.byID.has(id)) {
        id = generateID()
      }
    }

    const upperID = id.toUpperCase()
    const evt = new Event(upperID, ...args)
    this.byID.set(upperID, evt)
    return evt
  }

  lookup (id) {
    const e = this.byID.get(id.toUpperCase())
    if (e === undefined) {
      throw buildInvalidEventError({ eventID: id })
    }
    return e
  }

  delete (id) {
    if (!this.byID.delete(id.toUpperCase())) {
      throw buildInvalidEventError({ eventID: id })
    }
  }

  size () {
    return this.byID.size
  }

  serialize () {
    return {
      byID: Array.from(this.byID, pair => [pair[0], pair[1].serialize()])
    }
  }

  search (filter) {
    const es = Array.from(this.byID, pair => pair[1]).filter(e => e.matches(filter))
    es.sort((a, b) => a.compareTo(b))
    return new EventSet(this.robot, es)
  }

  static deserialize (robot, payload) {
    const s = new EventStore(robot)
    s.byID = new Map(
      payload.byID.map(pair => [pair[0], Event.deserialize(pair[1])])
    )
    return s
  }
}

module.exports = { EventStore }
