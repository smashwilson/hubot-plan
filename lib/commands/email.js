module.exports = {
  command: "email [<address>]",

  description: "View or modify your recognized email addresses.",

  builder(yargs) {
    return yargs
      .option("for", {
        description: "Enact changes on behalf of a different user.",
        string: true,
        default: null,
      })
      .option("default", {
        describe:
          "Set the provided address as the default address to use for created events and accepted invitations.",
        boolean: true,
        default: false,
      })
      .option("delete", {
        describe: "Remove an existing address.",
        boolean: true,
        default: false,
      });
  },

  handler({store, msg}, argv) {
    console.log(require("util").inspect(argv, {depth: null}));
  },
};
