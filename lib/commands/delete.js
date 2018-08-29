module.exports = {
  command: 'delete <id>',

  description: 'Delete an event.',

  builder (yargs) {
    return yargs
  },

  handler ({ store, msg }, argv) {
    const name = store.lookup(argv.id).getName()
    store.delete(argv.id)
    msg.send(`Event "${name}" has been deleted.`)
  }
}
