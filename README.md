# hubot-plan

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

hubot-plan requires configuration in the form of environment variables set for your Hubot process.

* `HUBOT_PLAN_GOOGLE_CAL_KEY` must be set to a client key generated on the Google console. See ["calendar setup"](#calendar-setup) for details.

## Commands

Note that your hubot may have a different name or an alias. Commands are shown with a "hubot:" prefix for consistency. This package uses an [argument name parser for command-line tools](https://www.npmjs.com/package/yargs) so it obeys many of the same conventions from shells like bash - double-dash `--arg`, quoting multi-word arguments with double-quotes or single-quotes.

### @-mentions

By default, commands that list event attendees will list users by their chosen display names, but _not_ [@-mention them and generate a notification](https://api.slack.com/docs/message-formatting#linking_to_channels_and_users). This prevents users from being pinged every time the event is listed. If you _do_ want to notify an event's attendees, add the `--ping` argument.

### Specifying dates

Event dates can be specified in [ISO-8601 format](https://en.wikipedia.org/wiki/ISO_8601). You can specify only dates for full-day events (`2018-01-27`) or exact times (`2018-01-27T17:30`).

### Identifying events

Most commands require identifying a specific event to operate on. Any time this is the case, you may either use:

1. Part of the event's name, as long as it **uniquely identifies** an event by a case-insensitive search over the names of known future events. If it's name contains a space, you can use double or single quotes; `hubot: event edit 'Some long title'`.
1. The event's assigned ID, a collection of alphanumeric characters chosen at random when the event was created.

### Calendar setup

To link your bot to an existing Google calendar, you'll first need to grant access to the API project associated with the `HUBOT_PLAN_GOOGLE_CAL_KEY`.

1. Create a ["Service account"](https://cloud.google.com/docs/authentication/getting-started) in the Google developer console. Assign it the "Service Account User" role.
1. Generate a key, ensuring it has access to the following OAuth scopes:
  * `https://www.googleapis.com/auth/calendar`
  * `https://www.googleapis.com/auth/calendar.events`
1. Grant full calendar access ("Make changes and manage sharing") is granted to the service account user by adding its associated email address in the calendar's "sharing" settings.

Now restart your bot with the generated key as `HUBOT_PLAN_GOOGLE_CAL_KEY`, and as a bot admin, run one of the following commands to take possession of a calendar:

* `hubot: event use-calendar "Name"`. The "Name" provided will be used to case-insensitively search the names of all calendars visible to the service account. If exactly one calendar matches with the appropriate access level, all subsequent `event` commands will manipulate this calendar. Otherwise, you'll be shown the matches and prompted to try again.
* `hubot: event use-calendar-id Y2Y0bDc0ZW9kd...`. The "ID" provided can be found in the URL when you visit the calendar's settings page. Use this form if you have two calendars with the same name or if you're just a turbonerd :neckbeard:

The channel that you run this command from will become the _primary channel_ for this calendar. New events and event changes from this calendar will be announced here, and `hubot: event` commands run from this channel will default to operating on this calendar.

### Calendar and account management

Before you can bridge the Google Calendar/Hubot divide, you'll need to tell Hubot what email addresses are you, and which email address it should use on your behalf for Google Calendar operations. You may have many email addresses associated with your Slack user: these will be used to recognize you if you've been invited with a different address and display you nicely as a username or @-mention in Slack interactions. But, you'll need to specify a _default_ address from among them, to be used on new invites or created events.

The email address provided by the Slack API will be used as the only and default address. If this isn't correct, you can fix it with these commands:

* `hubot: event email user@example.com`. Associate the address "user@example.com" with your Slack account if it isn't already. If you had no other addresses previously, this will also become your default.
* `hubot: event email --default user@example.com`. Associate the address "user@example.com" with your Slack account if it wasn't already and make it your default.
* `hubot: event email`. Show the email addresses that Hubot will recognize as you and which one is currently the default.
* `hubot: event email --delete user@example.com`. Unassociate the address "user@example.com" from your Slack account.

You'll also want to give yourself access to the calendar on the Google Calendar side. To grant your default email address access to the associated calendar, use:

* `hubot: event invite`. Grant the current user write access to the active calendar.

### Synchronizing

The Google Calendar and Hubot-local views will automatically be synchronized when you attempt to modify an event that's out of date or periodically at regular intervals. However, if you'd like to do it manually, you can do so with:

* `hubot: event sync`. Notice and announce new events or changes to existing events.

### Creating events

To create a new event at a known time, use [Google Calendar](https://calendar.google.com/). The event you create will be assigned a unique ID and announced in the calendar's primary channel the next time a sync occurs.

If you wish to:

* Propose several dates and see which is more popular before finalizing one
* Invite users by Slack handle instead of email address

Then you may create new events with the `hubot: event create` command. Examples:

* `hubot: event create --name "Party at @frey's House"`. Create an empty event.

* `hubot: event create --name "Party at @frey's House" --at 2018-03-12`. Create an event with a known final date.

* `hubot: event create --name "Party at @frey's House" --propose 2018-03-12T13:00 --propose 2018-03-17T14:00`. Create an event with two possible dates. Give others a chance to share their availability before choosing a final date.

Other arguments:

* `--invite @username`. Explicitly invite a user who you think would be interested in attending. Note that users don't need to be explicitly invited to respond to an event.
* `--calendar "Name"`. If multiple calendars are being managed, create this event on the unique calendar whose name case insensitively matches "Name". This defaults to the current channel's managed calendar, if one is present, or a single managed calendar if there's only one to choose from.

Once the event has been created, it will be assigned an _ID_ - a unique, alphanumeric string that uniquely identifies the event, even if you create several with the same name.

### Responding to invitations

Responses to the event through the Google Calendar UI will be announced at the next sync. If you prefer to respond in chat instead:

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
