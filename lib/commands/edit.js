const {EventManipulator} = require('./event-manipulator')

module.exports = {
  command: ['edit <id>', '*'],

  description: 'Edit, show, or respond to an existing event.',

  builder (yargs) {
    return yargs
      .option('name', {
        describe: 'Change this event\'s display name.',
        string: true
      })
      .option('propose', {
        describe: 'Propose a new *possible* date for this event. May be given multiple times.',
        array: true,
        default: []
      })
      .option('unpropose', {
        describe: 'Remove a previously proposed date by index. May be given multiple times.',
        array: true,
        default: []
      })
      .option('invite', {
        describe: 'Explicitly invite one or more participants. May be given multiple times.',
        array: true,
        default: []
      })
      .option('uninvite', {
        describe: 'Remove an explicitly invited participant. May be given multiple times.',
        array: true,
        default: []
      })
      .help()
  },

  handler (context, argv) {
    const evt = context.store.lookup(argv.id)
    const manip = new EventManipulator(evt, context)

    manip.handleNameArg(argv.name)
    manip.handleProposeArg(argv.propose)
    manip.handleUnproposeArg(argv.unpropose)
    manip.handleInviteArg(argv.invite)
    manip.handleUninviteArg(argv.uninvite)

    context.msg.send({
      attachments: manip.renderAllAttachments()
    })
  }
}
