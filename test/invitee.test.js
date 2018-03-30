/* eslint-env mocha */

const assert = require('chai').assert

const {Invitee} = require('../lib/invitee')

describe('Invitee', function () {
  let inv

  const userSource = {
    nameForID: uid => {
      return {U1234: 'user0'}[uid]
    },

    emailForID: uid => {
      return {U1234: 'foo@bar.com'}[uid]
    }
  }

  describe('with a Slack identify', function () {
    beforeEach(function () {
      inv = Invitee.withUID('U1234')
    })

    it('renders a notification', function () {
      assert.strictEqual(inv.notify(userSource), '<@U1234>')
    })

    it('renders a quiet mention', function () {
      assert.strictEqual(inv.mention(userSource), 'user0')
    })

    it('renders an email address', function () {
      assert.strictEqual(inv.email(userSource), 'foo@bar.com')
    })

    it('renders a mention with an invalid ID', function () {
      const bad = Invitee.withUID('U6789')
      assert.strictEqual(bad.mention(userSource), '`!U6789`')
    })

    it('renders an email with an invalid ID', function () {
      const bad = Invitee.withUID('U1111')
      assert.strictEqual(bad.email(userSource), `U1111@slack-id.com`)
    })
  })

  describe('without a Slack identity', function () {
    beforeEach(function () {
      inv = Invitee.free('Someone Else')
    })

    it('renders notification-style', function () {
      assert.strictEqual(inv.notify(userSource), 'Someone Else')
    })

    it('renders mention-style', function () {
      assert.strictEqual(inv.mention(userSource), 'Someone Else')
    })

    it('renders an email address', function () {
      assert.strictEqual(inv.email(userSource), 'Someone Else')
    })
  })
})
