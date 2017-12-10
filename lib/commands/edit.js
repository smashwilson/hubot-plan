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
        string: true,
        requiresArg: true
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
      .option('finalize', {
        describe: 'Choose the final date of the event.',
        number: true,
        requiresArg: true
      })
      .option('unfinalize', {
        describe: 'Unchoose the final date.',
        boolean: true
      })
      .option('yes', {
        describe:
          'Confirm your ability to attend a proposed date by index, or the chosen date on a finalized event. ' +
          'May be given multiple times.',
        array: true,
        number: true,
        default: []
      })
      .option('no', {
        describe:
          "State that you won't be able to attend a proposed date by index or _any_ proposed date if no index " +
          'argument is provided. May be given multiple times.',
        array: true,
        number: true,
        default: []
      })
      .option('for', {
        describe: 'Accept or reject proposed dates on behalf of another user.',
        string: true,
        requiresArg: true
      })
      .help()
  },

  handler (context, argv) {
    const evt = context.store.lookup(argv.id)
    const manip = new EventManipulator(evt, context)

    const target = manip.toUid(argv.for || context.msg.message.user.id)
    const accepted = []
    const rejected = []
    let message

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
        if (evt.isFinalized()) {
          evt.finalProposal().no(target)
          rejected.push(evt.finalProposal())
        } else {
          for (const i of evt.proposalKeys()) {
            evt.rejectProposal(target, i)
            rejected.push(evt.proposal(i))
          }
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
    if (manip.handleProposeArg(target, argv.propose)) modified = true
    if (manip.handleUnproposeArg(argv.unpropose)) modified = true
    if (manip.handleInviteArg(argv.invite)) modified = true
    if (manip.handleUninviteArg(argv.uninvite)) modified = true

    if (argv.finalize !== undefined) {
      evt.finalize(argv.finalize)
      modified = true
    }

    if (argv.unfinalize) {
      evt.unfinalize()
      message = 'The event "Something Cool" may now have its final date reassigned.'
      modified = true
    }

    if (rsvp) {
      message = 'You have confirmed that '
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
      const payload = {attachments: manip.renderAllAttachments()}
      if (message) {
        payload.text = message
      }
      context.msg.send(payload)
    }
  }
}
