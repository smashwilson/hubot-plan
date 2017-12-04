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

module.exports = function (robot) {
  robot.__now = function (userTz) {
    return moment.tz(userTz)
  }

  robot.respond(/event ([^]*)/i, async function (msg) {
    const store = new EventStore()

    const userTz = msg.message.user.tz || 'America/New_York'
    const now = robot.__now(userTz)

    const createCommand = argv => {
      const evt = store.create(argv.id, argv.name)

      const invalid = []
      for (const proposeTs of argv.propose) {
        const ts = moment.tz(proposeTs, moment.ISO_8601, userTz)
        if (ts.isValid()) {
          evt.proposeDate(ts)
        } else {
          invalid.push(proposeTs)
        }
      }

      const attachments = [evt.asAttachment(now)]
      if (invalid.length > 0) {
        attachments.push({
          text: 'Unable to parse dates'
        })
      }

      msg.send({
        text: `The event "${evt.getName()}" has been created with id *${evt.getID()}*.`,
        attachments: [evt.asAttachment()]
      })
    }

    const y = yargs
      .usage('event [create|delete|list] <args>')
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
}
