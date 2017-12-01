const Helper = require('hubot-test-helper')
const helper = new Helper('../lib/index.js')

class BotContext {
  constructor () {
    this.room = helper.createRoom({httpd: false})
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

module.exports = {BotContext}
