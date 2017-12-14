const Helper = require('hubot-test-helper')
const {Timespan} = require('../lib/timespan')

const helper = new Helper('../lib/index.js')

const TZ = 'America/Los_Angeles'

const lastWeek = Timespan.parse('2017-11-10', TZ)
const yesterday = Timespan.parse('2017-11-17', TZ)
const now = Timespan.parse('2017-11-18', TZ)
const tomorrow = Timespan.parse('2017-11-19', TZ)
const nextWeek = Timespan.parse('2017-11-25', TZ)
const nextMonth = Timespan.parse('2017-12-16', TZ)
const nextYear = Timespan.parse('2018-01-10', TZ)

class BotContext {
  constructor () {
    this.room = helper.createRoom({httpd: false})
    this.room.robot['hubot-events'].getUserTz = () => TZ
    this.room.robot['hubot-events'].now = userTz => now.getStart().clone().tz(userTz)
  }

  createUser (uid, username, email) {
    this.room.robot.brain.userForId(uid, {name: username, email_address: email})
  }

  withStore (cb) {
    return this.room.robot['hubot-events'].withStore(cb)
  }

  say (uid, message) {
    return this.room.user.say(uid, message)
  }

  response () {
    const ms = this.room.messages
    const lastMessage = ms[ms.length - 1]
    return lastMessage[0] === 'hubot' ? lastMessage[1] : undefined
  }

  cleanup () {
    return this.room.destroy()
  }
}

module.exports = {
  BotContext,
  ts: {lastWeek, yesterday, now, tomorrow, nextWeek, nextMonth, nextYear}
}
