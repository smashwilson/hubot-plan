const {EventManipulator} = require('./event-manipulator')

function elided (parts) {
  if (parts.length === 1) {
    return parts[0]
  } else if (parts.length === 2) {
    return `${parts[0]} or ${parts[1]}`
  } else {
    return parts.slice(0, parts.length - 1).join(', ') +
      `, or ` + parts[parts.length - 1]
  }
}

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
      .option('yes', {
        describe: 'Confirm your ability to attend a proposed date by index. May be given multiple times.',
        array: true,
        number: true,
        default: []
      })
      .option('no', {
        describe: "State that you won't be able to attend a proposed date by index. May be given multiple times.",
        array: true,
        number: true,
        default: []
      })
      .option('for', {
        describe: 'Accept or reject proposed dates on behalf of another user.',
        string: true
      })
      .help()
  },

  handler (context, argv) {
    const evt = context.store.lookup(argv.id)
    const manip = new EventManipulator(evt, context)

    const target = argv.for ? manip.toUid(argv.for) : context.msg.message.user.id
    const accepted = []
    const rejected = []

    for (const yi of argv.yes) {
      if (yi === undefined) {
        evt.finalProposal().yes(target)
        accepted.push(evt.finalProposal())
      } else if (isNaN(yi)) {
        //
      } else {
        evt.acceptProposal(target, yi)
        accepted.push(evt.proposal(yi))
      }
    }

    for (const ni of argv.no) {
      if (ni === undefined) {
        for (const i of evt.proposalKeys()) {
          evt.rejectProposal(target, i)
        }
      } else if (isNaN(ni)) {
        //
      } else {
        evt.rejectProposal(target, ni)
        rejected.push(evt.proposal(ni))
      }
    }

    const rsvp = accepted.length > 0 || rejected.length > 0

    let modified = false
    if (manip.handleNameArg(argv.name)) modified = true
    if (manip.handleProposeArg(argv.propose)) modified = true
    if (manip.handleUnproposeArg(argv.unpropose)) modified = true
    if (manip.handleInviteArg(argv.invite)) modified = true
    if (manip.handleUninviteArg(argv.uninvite)) modified = true

    if (rsvp) {
      let message = 'You have confirmed that '
      if (argv.for) {
        message += target
      } else {
        message += 'you'
      }

      if (accepted.length > 0) {
        if (evt.isFinalized()) {
          message += ' will '
        } else {
          message += ' would '
        }
        message += `be able to attend "${evt.getName()}" on `
        message += elided(accepted.map(p => `*${p.date().format('D MMMM YYYY')}*`))

        if (rejected.length > 0) {
          message += ', but '
        }
      }

      if (rejected.length > 0) {
        if (evt.isFinalized()) {
          message += ' will not '
        } else {
          message += ' would not '
        }
        message += 'be able to attend '
        if (accepted.length === 0) {
          message += `"${evt.getName()}" `
        }
        message += 'on '
        message += elided(rejected.map(p => `*${p.date().format('D MMMM YYYY')}*`))
      }

      message += '.'

      if (modified) {
        context.msg.send({
          text: message,
          attachments: manip.renderAllAttachments()
        })
      } else {
        context.msg.send(message)
      }
    } else {
      context.msg.send({
        attachments: manip.renderAllAttachments()
      })
    }
  }
}
