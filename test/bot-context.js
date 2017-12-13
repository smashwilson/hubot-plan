const Helper = require('hubot-test-helper')
const moment = require('moment-timezone')

const helper = new Helper('../lib/index.js')

const lastWeek = moment.tz('2017-11-10', moment.ISO_8601, 'America/New_York')
const yesterday = moment.tz('2017-11-17', moment.ISO_8601, 'America/New_York')
const now = moment.tz('2017-11-18', moment.ISO_8601, 'America/New_York')
const tomorrow = moment.tz('2017-11-19', moment.ISO_8601, 'America/New_York')
const nextWeek = moment.tz('2017-11-25', moment.ISO_8601, 'America/New_York')
const nextMonth = moment.tz('2017-12-16', moment.ISO_8601, 'America/New_York')
const nextYear = moment.tz('2018-01-10', moment.ISO_8601, 'America/New_York')
const TZ = 'America/Los_Angeles'


class BotContext {
  constructor () {
    this.room = helper.createRoom({httpd: false})
    this.room.robot['hubot-events'].now = userTz => now.clone().tz(userTz)
    this.room.robot['hubot-events'].getUserTz = () => TZ
  }

  createUser (uid, username) {
    this.room.robot.brain.userForId(uid, {name: username})
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
