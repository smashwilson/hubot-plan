function buildError (props) {
  const e = new Error(props.message)
  for (const k in props) {
    e[k] = props[k]
  }
  return e
}

module.exports = {
  buildInvalidProposalError ({eventID, eventName, proposal}) {
    return buildError({
      message: 'Invalid proposed date',
      reply: `Event "${eventName}" does not have a proposed date "${proposal}".`,
      eventID
    })
  },

  buildUnfinalizedEventError ({eventID, eventName}) {
    return buildError({
      message: 'Event not finalized',
      reply: `Event "${eventName}" has not had a final date chosen yet.`,
      eventID
    })
  },

  buildFinalizedEventError ({eventID, eventName}) {
    return buildError({
      message: 'Event already finalized',
      reply: `Event "${eventName}" has already had a final date chosen.`,
      eventID
    })
  },

  buildInvalidEventError ({eventID}) {
    return buildError({
      message: 'Invalid event ID',
      reply: `There is no event with the ID ${eventID}.`
    })
  }
}
