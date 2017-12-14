class EventSet {
  constructor (robot, events) {
    this.robot = robot
    this.events = events
  }

  size () { return this.events.length }

  at (ind) { return this.events[ind] }

  asLines () {
    return this.events.map(e => e.asLine())
  }
}

module.exports = {EventSet}
