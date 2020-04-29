module.exports = {
  command: "delete <id>",

  description: "Delete an event.",

  builder(yargs) {
    return yargs;
  },

  handler({store, msg}, argv) {
    const events = store.getEventStore();
    const name = events.lookup(argv.id).getName();
    events.delete(argv.id);
    msg.send(`Event "${name}" has been deleted.`);
  },
};
