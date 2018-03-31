# hubot-plan

[![Greenkeeper badge](https://badges.greenkeeper.io/smashwilson/hubot-plan.svg)](https://greenkeeper.io/)

Plan events with chatops :sparkles: :calendar:

## Installation

Install the hubot-plan package from npm and add it to your `package.json` file:

```bash
$ npm install hubot-plan
```

Now add the hubot-plan module to `external-scripts.json`:

```
$ cat external-scripts.json
['hubot-plan']
```

## Commands

Note that your hubot may have a different name or an alias. Commands are shown with a "hubot:" prefix for consistency. This package uses an [argument name parser for command-line tools](https://www.npmjs.com/package/yargs) so it obeys many of the same conventions from shells like bash - double-dash `--arg`, quoting multi-word arguments with double-quotes or single-quotes.

### @-mentions

By default, commands that list event attendees will list users by their chosen display names, but _not_ [@-mention them and generate a notification](https://api.slack.com/docs/message-formatting#linking_to_channels_and_users). This prevents users from being pinged every time the event is listed. If you _do_ want to notify an event's attendees, add the `--ping` argument.

### Specifying dates

Event dates can be specified in [ISO-8601 format](https://en.wikipedia.org/wiki/ISO_8601). You can specify only dates for full-day events (`2018-01-27`) or exact times (`2018-01-27T17:30`).

### Creating events

Create new events with the `hubot: event create` command. Examples:

* `hubot: event create --name "Party at @frey's House"`. Create an empty event.

* `hubot: event create --name "Party at @frey's House" --at 2018-03-12`. Create an event with a known final date.

* `hubot: event create --name "Party at @frey's House" --propose 2018-03-12T13:00 --propose 2018-03-17T14:00`. Create an event with two possible dates. Give others a chance to share their availability before choosing a final date.

Other arguments:

* `--invite @username`. Explicitly invite a user who you think would be interested in attending. Note that users don't need to be explicitly invited to respond to an event.

Once the event has been created, it will be assigned an _ID_ - a unique, alphanumeric string that uniquely identifies the event, even if you create several with the same name.

### Responding to invitations

To respond to an event that does not have a final date chosen:

* `hubot: event ABC123 --yes 0` to indicate that you would be able to attend the proposed date with index 0.

* `hubot: event ABC123 --yes 1 --yes 3` to indicate that you would be able to attend the proposed dates 1 and 3.

To respond to an event that has had a final date chosen:

* `hubot: event ABC123 --yes` to say you can make it;

* `hubot: event ABC123 --no` to say you can't.

### Changing events

To modify an event after it's created, call `hubot: event` with the ID it's been assigned and other arguments. You can also use `hubot: event <id>` with no further arguments to view the current state of an event.

* `hubot: event ABC123 --propose 2018-04-01T14:00`. Propose an additional date and time for the event. You may specify --propose more than once to propose more than one date at a time.

* `hubot: event ABC123 --unpropose 2`. Remove a proposed date from the running by index. Note that the other proposed dates will remain with their original indices.

* `hubot: event ABC123 --invite @username`. Invite an additional user to the event.

* `hubot: event ABC123 --uninvite @username`. Remove an invited user from the event. (The user can still reply normally, but won't be @-mentioned when the event is shown.)

* `hubot: event ABC123 --finalize 1`. Choose one of the event's proposed dates as its final date. Everyone who previously replied with `--yes 1` will automatically be converted to a "yes" for that date; everyone who responded with a different date will be converted to a "no".

* `hubot: event ABC123 --finalize`. Choose the _only_ proposed date as its final one.

* `hubot: event ABC123 --at 2018-04-01`. Propose and finalize a new date for the event at the same time.

* `hubot: event ABC123 --unfinalize`. Reverse a finalization to allow you to pick a different date.

### Listing events

To see existing events and their IDs:

* `hubot: event list` defaults to showing events that have not yet occurred.

* `hubot: event list --all` shows all events, even ones that have elapsed.

* `hubot: event list --before 2018-01-01` shows events before a timestamp. `--after` works similarly.

* `hubot: event list --finalized` shows only events that have had a final date chosen. `--unfinalized` shows events that have not yet had a final date chosen.

* `hubot: event list --invited @username` shows only events that invite a specific username.

Specifying multiple filters at once shows events that match all criteria (so, it combines them with "and").

### Deleting events

* `hubot: event delete ABC123` to delete an event with ID ABC123.
