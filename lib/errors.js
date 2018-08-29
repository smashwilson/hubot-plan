function buildError (props) {
  const e = new Error(props.message)
  for (const k in props) {
    e[k] = props[k]
  }
  return e
}

module.exports = {
  buildInvalidProposalError ({ eventID, eventName, proposal }) {
    return buildError({
      message: 'Invalid proposed date',
      reply: `Event "${eventName}" does not have a proposed date "${proposal}".`,
      eventID
    })
  },

  buildNoProposalsError ({ eventID, eventName }) {
    return buildError({
      message: 'No proposed dates',
      reply: `Event "${eventName}" has no proposed dates.`,
      eventID
    })
  },

  buildMultipleProposalsError ({ eventID, eventName, proposalCount }) {
    return buildError({
      message: 'More than one proposed date',
      reply: `Event "${eventName}" has ${proposalCount} proposed dates, so you must specify one to finalize the event.`,
      eventID
    })
  },

  buildUnfinalizedEventError ({ eventID, eventName }) {
    return buildError({
      message: 'Event not finalized',
      reply: `Event "${eventName}" has not had a final date chosen yet.`,
      eventID
    })
  },

  buildFinalizedEventError ({ eventID, eventName }) {
    return buildError({
      message: 'Event already finalized',
      reply: `Event "${eventName}" has already had a final date chosen.`,
      eventID
    })
  },

  buildInvalidEventError ({ eventID }) {
    return buildError({
      message: 'Invalid event ID',
      reply: `There is no event with the ID ${eventID}.`
    })
  },

  buildInvalidTimestampError ({ ts }) {
    return buildError({
      message: 'Unable to parse timestamp',
      reply:
        `Unable to parse a timestamp from "${ts}". ` +
        `Please use <ISO 8601|https://en.wikipedia.org/wiki/ISO_8601> format.`
    })
  }
}
