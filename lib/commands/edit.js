const {EventManipulator} = require('./event-manipulator')

module.exports = {
  command: ['edit <id>', '*'],

  description: 'Edit, show, or respond to an existing event.',

  builder (yargs) {
    return yargs
      .option('propose', {
        describe: 'Propose a new *possible* date for this event. May be given multiple times.',
        array: true,
        default: []
      })
      .option('invite', {
        describe: 'Explicitly invite one or more participants. May be given multiple times.',
        array: true,
        default: []
      })
      .help()
  },

  handler (context, argv) {
    const evt = context.store.lookup(argv.id)
    const manip = new EventManipulator(evt, context)

    manip.handleProposeArg(argv.propose)
    // manip.handleInviteArg(argv.invite)

    context.msg.send({
      attachments: manip.renderAllAttachments()
    })
  }
}
