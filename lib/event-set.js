const { ICalPresenter } = require('./ical-presenter')
const { RobotUserSource } = require('./commands/helpers')

class EventSet {
  constructor (robot, events) {
    this.robot = robot
    this.events = events
  }

  size () { return this.events.length }

  at (ind) { return this.events[ind] }

  presentWith (presenter) {
    return presenter.presentAll(this.events)
  }

  renderICal ({ calendarName, userTz }) {
    const p = new ICalPresenter({
      userSource: new RobotUserSource(this.robot),
      calendarName,
      userTz
    })

    return p.present(this)
  }
}

module.exports = { EventSet }
