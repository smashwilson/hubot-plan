# hubot-plan

Plan events with chatops :sparkles: :calendar:

## Installation

## Commands

Propose a new event, suggest possible times, and invite possible attendees.

```
smashwilson: @hubot event create --name "Party at Frey's House" --propose --11-24 --propose --12-4

hubot: @smashwilson: event `ABCD10` created.

> _Party at Frey's House_
> Possible dates:
> [0] 24 November 2017 _14 days from now_
> [1] 4 December 2017 _24 days from now_

smashwilson: @hubot event ABCD10 --propose 2018-01-10

hubot: @smashwilson: _Party at Frey's House_ edited.

> _Party at Frey's House_
> Possible dates:
> [0] 24 November 2017 _in 14 days_
> [1] 4 December 2017 _in 24 days_
> [2] 10 January 2018 _in 61 days_

smashwilson: @hubot event ABCD10 --invite @frey --invite @fenris --invite @femshep --invite @hdcunni

hubot: @smashwilson: Invited @frey, @fenris, @femshep, and @hdcunni to _Party at Frey's House_.

> _Party at Frey's House_
> Possible dates:
> [0] 24 November 2017 _in 14 days_ *x0*
> [1] 4 December 2017 _in 24 days_ *x0*
> [2] 10 January 2018 _in 61 days_ *x0*
> Invited: @frey ?, @fenris ?, @femshep ?, @hdcunni ? _(4 yet to respond)_
```

Weigh in on upcoming events to share your availability:

```
fenris: @hubot event ABCD10 --yes 0 --yes 2

hubot: @fenris: Okay, you can make _Party at Frey's House_ on 24 November 2017 or 10 January 2018.

femshep: @hubot event ABCD10 --yes 2

hubot: @femshep: Okay, you can make _Party at Frey's House_ on 10 January 2018.

smashwilson: @hubot event ABCD10 --for @frey --yes 0 --yes 1 --yes 2

hubot: @smashwilson: Okay, @frey can make _Party at Frey's House_ on 24 November 2017, 4 December 2017, or 10 January 2018.

smashwilson: @hubot event ABCD10

hubot:

> _Party at Frey's House_
> Possible dates:
> [0] 24 November 2017 _in 14 days_ *x3* :star:
> [1] 4 December 2017 _in 24 days_ *x0*
> [2] 10 January 2018 _in 61 days_ *x2*
> Invited: @frey +, @fenris +, @femshep +, @hdcunni ? _(1 yet to respond)_
```

Choose a final option:

```
smashwilson: @hubot event ABCD10 --finalize 0

hubot: @smashwilson: Okay, _Party at Frey's House_ will be at *24 November 2017*.

> _Party at Frey's House_ on 24 November 2017 _14 days from now_.
> Attendees: @frey +, @fenris +, @femshep -, @hdcunni ? _(1 yet to respond)_
```

Update your response as circumstances change:

```
fenris: @hubot event ABCD10 --no

hubot: @fenris: Okay, you can't attend _Party at Frey's House_ any more.

smashwilson: @hubot event ABCD10

> _Party at Frey's House_ on 24 November 2017 _14 days from now_.
> Attendees: @frey +, @fenris -, @femshep -, @hdcunni +
```
