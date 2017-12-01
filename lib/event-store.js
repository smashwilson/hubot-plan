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

  create (...args) {
    let id = generateID()
    while (this.byID.has(id)) {
      id = generateID()
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
}

module.exports = {EventStore}
