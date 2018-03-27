/* eslint-env mocha */

const assert = require('chai').assert

const {Invitee} = require('../lib/invitee')

describe('Invitee', function () {
  let inv

  describe('with a Slack identify', function () {
    function nameForID (uid) {
      if (uid === 'U1234') {
        return 'user0'
      }
      return undefined
    }

    beforeEach(function () {
      inv = Invitee.withUID('U1234')
    })

    it('renders a notification', function () {
      assert.strictEqual(inv.notify(nameForID), '<@U1234>')
    })

    it('renders a quiet mention', function () {
      assert.strictEqual(inv.mention(nameForID), 'user0')
    })

    it('renders a mention with an invalid ID', function () {
      const bad = Invitee.withUID('U6789')
      assert.strictEqual(bad.mention(nameForID), '`!U6789`')
    })
  })

  describe('without a Slack identity', function () {
    function nope (uid) {
      throw new Error('Should not be called')
    }

    beforeEach(function () {
      inv = Invitee.free('Someone Else')
    })

    it('renders notification-style', function () {
      assert.strictEqual(inv.notify(nope), 'Someone Else')
    })

    it('renders mention-style', function () {
      assert.strictEqual(inv.mention(nope), 'Someone Else')
    })
  })
})
