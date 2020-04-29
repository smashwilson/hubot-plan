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

  handler({robot, store, msg}, argv) {
    const emailStore = store.getEmailStore();
    const targetUid = msg.message.user.id;
    let action = "";

    if (argv.address) {
      if (argv.delete) {
        emailStore.remove(targetUid, argv.address);
        action = `Email address ${argv.address} removed.\n`;
      } else if (argv.default) {
        emailStore.add(targetUid, argv.address, true);
        action = `Email address ${argv.address} added and set as your default.\n`;
      } else {
        emailStore.add(targetUid, argv.address, false);
        action = `Email address ${argv.address} added.\n`;
      }
    }

    const knownEmails = emailStore.known(targetUid);
    if (knownEmails.length === 0) {
      msg.send(
        "I don't know any email addresses for you yet. Care to set one?\n" +
          "```\n" +
          robot.name +
          ": event email <address>\n```\n"
      );
    } else {
      const defaultEmail = emailStore.getDefault(targetUid);
      const slackEmail = emailStore.getSlackProvided(targetUid);

      const response = [];
      for (const email of knownEmails) {
        const parts = [];

        let italic = "";
        let bold = "";

        if (email === slackEmail) {
          parts.push(":slack:");
          italic = "_";
        }

        if (email === defaultEmail) {
          parts.push(":star:");
          bold = "*";
        }

        parts.push(italic + bold + email + bold + italic);
        response.push(parts.join(" "));
      }
      msg.send(action + response.join(", "));
    }
  },
};
