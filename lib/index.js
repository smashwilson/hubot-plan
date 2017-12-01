// Description:
//   Cooperatively plan events.
//
// Commands:
//   hubot event create --help - Create a new event.
//   hubot event [ABCD10] --help - View or modify an existing event.
//   hubot event delete ABCD10 - Delete an event.
//   hubot event list --help - List existing events.

const yargs = require('yargs')
const {EventStore} = require('./event-store')

module.exports = function (robot) {
  robot.respond(/event ([^]*)/i, async function (msg) {
    const store = new EventStore()

    const createCommand = argv => {
      const evt = store.create(argv.id, argv.name)
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
            type: 'string',
            demandOption: true
          })
          .option('id', {
            describe: 'Unique string used to identify this event in further commands.',
            type: 'string'
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
