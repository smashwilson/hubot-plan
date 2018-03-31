const {EventManipulator} = require('./helpers')

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

const OMITTED = Symbol('omitted')

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
        default: OMITTED
      })
      .option('unfinalize', {
        describe: 'Unchoose the final date.',
        boolean: true
      })
      .option('at', {
        describe: 'Choose and finalize a new date.'
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
      .option('ping', {
        describe: 'Notify invited users with an @-mention.',
        boolean: true,
        default: false
      })
  },

  handler (context, argv) {
    const evt = context.store.lookup(argv.id)
    const manip = new EventManipulator(evt, context)

    const target = manip.toInvitee(argv.for || context.msg.message.user.id)
    const source = manip.getUserSource()
    const accepted = []
    const rejected = []
    let message = ''

    for (const yi of argv.yes) {
      if (yi === undefined) {
        evt.invite(target)
        evt.finalProposal().yes(target)
        evt.responded(target)
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
          evt.invite(target)
          evt.finalProposal().no(target)
          evt.responded(target)
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
    if (manip.handleAtArg(target, argv.at)) modified = true
    if (manip.handleNameArg(argv.name)) modified = true
    if (manip.handleProposeArg(target, argv.propose)) modified = true
    if (manip.handleUnproposeArg(argv.unpropose)) modified = true

    if (manip.handleInviteArg(argv.invite)) {
      if (message.length > 0) message += '\n'
      message += argv.invite.map(u => {
        return manip.toInvitee(u).mention(source)
      }).join(', ')
      message += (argv.invite.length === 1 ? ' has ' : ' have ')
      message += `been invited to the event "${evt.getName()}".`
    }

    if (manip.handleUninviteArg(argv.uninvite)) {
      if (message.length > 0) message += '\n'
      message += argv.uninvite.map(u => {
        return manip.toInvitee(u).mention(source)
      }).join(', ')
      message += (argv.uninvite.length === 1 ? ' has ' : ' have ')
      message += `been uninvited from the event "${evt.getName()}".`
    }

    if (argv.finalize !== OMITTED) {
      evt.finalize(argv.finalize)
      modified = true
    }

    if (argv.unfinalize) {
      evt.unfinalize()
      if (message.length > 0) message += '\n'
      message += `The event "${evt.getName()}" may now have its final date reassigned.`
      modified = true
    }

    if (rsvp) {
      if (message.length > 0) message += '\n'
      message += 'You have confirmed that '
      if (argv.for) {
        message += target.mention(source)
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
        message += elided(accepted.map(p => `*${p.startDate().format('D MMMM YYYY')}*`))

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
        message += elided(rejected.map(p => `*${p.startDate().format('D MMMM YYYY')}*`))
      }

      message += '.'
    }

    if (modified) {
      const payload = {
        attachments: manip.renderAllAttachments(argv.ping)
      }
      if (message.length > 0) payload.text = message
      context.msg.send(payload)
    } else if (message.length > 0) {
      context.msg.send(message)
    } else {
      context.msg.send({attachments: manip.renderAllAttachments(argv.ping)})
    }
  }
}
