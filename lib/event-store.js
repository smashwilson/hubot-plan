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

  insert (evt) {
    let id = generateID()
    while (this.byID.has(id)) {
      id = generateID()
    }

    this.byID.set(id, evt)
    return id
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
