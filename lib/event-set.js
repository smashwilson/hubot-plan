class EventSet {
  constructor (events) {
    this.events = events
  }

  size () { return this.events.length }

  at (ind) { return this.events[ind] }

  asLines () {
    return this.events.map(e => e.asLine())
  }
}

module.exports = {EventSet}
