const { EventManipulator } = require('./helpers')

module.exports = {
  command: 'create',

  description: 'Create a new event.',

  builder (yargs) {
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
        string: true
      })
      .option('invite', {
        describe: 'Explicitly invite one or more participants. May be given multiple times.',
        array: true,
        string: true
      })
      .option('at', {
        describe: 'Name the already-finalized date for this event. Cannot be used with `--propose`.',
        string: true
      })
      .option('ping', {
        describe: 'Notify invited users with an @-mention.',
        boolean: true,
        default: false
      })
  },

  handler (context, argv) {
    const evt = context.store.create(argv.id, argv.name)
    const manip = new EventManipulator(evt, context)
    const invitee = manip.toInvitee(context.msg.message.user.id)

    evt.invite(invitee)
    evt.responded(invitee)

    manip.handleAtArg(invitee, argv.at)
    manip.handleProposeArg(invitee, argv.propose)
    manip.handleInviteArg(argv.invite)

    context.msg.send({
      text: `The event "${evt.getName()}" has been created with id *${evt.getID()}*.`,
      attachments: manip.renderAllAttachments(argv.ping)
    })
  }
}
