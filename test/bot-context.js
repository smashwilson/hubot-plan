const Helper = require('hubot-test-helper')
const moment = require('moment-timezone')

const helper = new Helper('../lib/index.js')

const now = moment.tz('2017-11-18', moment.ISO_8601, 'America/New_York')

const tomorrow = moment.tz('2017-11-19', moment.ISO_8601, 'America/New_York')
const nextWeek = moment.tz('2017-11-25', moment.ISO_8601, 'America/New_York')
const nextMonth = moment.tz('2017-12-16', moment.ISO_8601, 'America/New_York')

class BotContext {
  constructor () {
    this.room = helper.createRoom({httpd: false})
    this.room.robot['hubot-events'].now = userTz => now.clone().tz(userTz)
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
  ts: {now, tomorrow, nextWeek, nextMonth}
}
