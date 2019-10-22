module.exports = {
  command: "email [<address>]",

  description: "View or modify your recognized email addresses.",

  builder(yargs) {
    return yargs.option("default", {
      describe:
        "Set the provided address as the default address to use for created events and accepted invitations.",
      boolean: true,
      default: false,
    });
  },

  handler({store, msg}, argv) {
    if (argv.default) {
      //
    }
  },
};
