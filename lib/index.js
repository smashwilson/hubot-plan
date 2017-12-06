// Description:
//   Cooperatively plan events.
//
// Commands:
//   hubot event create --help - Create a new event.
//   hubot event [ABCD10] --help - View or modify an existing event.
//   hubot event delete ABCD10 - Delete an event.
//   hubot event list --help - List existing events.

const yargs = require('yargs')
const moment = require('moment-timezone')
const {EventStore} = require('./event-store')
const {nowFn} = require('./symbols')

const EVENT_STORE_KEY = 'hubot-events:event-store'

module.exports = function (robot) {
  robot[nowFn] = function (userTz) {
    return moment.tz(userTz)
  }

  robot['hubot-events'] = {
    getStore () {
      if (!this._eventStore) {
        const payload = robot.brain.get(EVENT_STORE_KEY)
        this._eventStore = payload ? EventStore.deserialize(payload) : new EventStore()
      }

      return this._eventStore
    },

    async withStore (cb) {
      const store = this.getStore()

      try {
        await cb(store)
      } finally {
        robot.brain.set(EVENT_STORE_KEY, store.serialize())
      }
    }
  }

  robot.respond(/event ([^]*)/i, function (msg) {
    robot['hubot-events'].withStore(async store => {
      const userTz = msg.message.user.tz || 'America/New_York'
      const now = robot[nowFn](userTz)

      const createCommand = argv => {
        const evt = store.create(argv.id, argv.name)
        const invalid = []

        if (argv.at) {
          const ts = moment.tz(argv.at, moment.ISO_8601, true, userTz)
          if (ts.isValid()) {
            evt.proposeDate(ts)
            evt.finalize(0)
          } else {
            invalid.push(argv.at)
          }
        } else {
          for (const proposeTs of argv.propose) {
            const ts = moment.tz(proposeTs, moment.ISO_8601, true, userTz)
            if (ts.isValid()) {
              evt.proposeDate(ts)
            } else {
              invalid.push(proposeTs)
            }
          }
        }

        for (const invitee of argv.invite) {
          const trimmed = invitee.replace(/^@/g, '')
          const uid = robot.brain.userForName(trimmed)
          if (uid) {
            evt.invite(`<@${uid.id}>`)
          } else {
            evt.invite(trimmed)
          }
        }

        const attachments = [evt.asAttachment(now)]
        if (invalid.length > 0) {
          attachments.push({
            fallback: `Unable to parse: ${invalid.join(', ')}`,
            title: 'Unable to parse proposed dates',
            text:
              'Please use <ISO 8601|https://en.wikipedia.org/wiki/ISO_8601> to format date arguments. ' +
              `For example, right now is \`${now.toISOString()}\`. ` +
              'The time bit may be omitted for whole-day events.' +
              `\n\nI couldn't parse: ${invalid.map(i => '`' + i + '`').join(', ')}.`,
            color: 'danger',
            mrkdwn_in: ['text']
          })
        }

        msg.send({
          text: `The event "${evt.getName()}" has been created with id *${evt.getID()}*.`,
          attachments
        })
      }

      const y = yargs
        .usage('event [create|edit|delete|list] <args>')
        .command('create', 'Create a new event.', yargs => {
          return yargs
            .option('name', {
              describe: 'Human-friendly, non-unique title for this event.',
              string: true,
              demandOption: true
            })
            .option('id', {
              describe: 'Unique string used to identify this event in further commands.',
              string: true
            })
            .option('propose', {
              describe: 'Propose a *possible* date for this event. May be given multiple times.',
              array: true,
              default: []
            })
            .option('invite', {
              describe: 'Explicitly invite one or more participants. May be given multiple times.',
              array: true,
              default: []
            })
            .option('at', {
              describe: 'Name the already-finalized date for this event. Cannot be used with `--propose`.',
              string: true
            })
            .help()
        }, createCommand)

      await new Promise(resolve => {
        y.parse(msg.match[1], (err, argv, output) => {
          if (err) {
            msg.reply(`:boom: You broke it!\n${msg}\n${y.help()}`)
            resolve(null)
          }

          if (output) {
            msg.reply(output)
          }

          resolve(argv)
        })
      })
    })
  })
}
