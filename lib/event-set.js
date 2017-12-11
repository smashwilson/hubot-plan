class EventSet {
  constructor (events) {
    this.events = events
  }

  size () { return this.events.length }

  at (ind) { return this.events[ind] }
}

module.exports = {EventSet}
