class Invitee {
  static withUID (uid) {
    return new UserInvitee(uid)
  }

  static free (name) {
    return new FreeInvitee(name)
  }
}

class UserInvitee extends Invitee {
  constructor (uid) {
    super()
    this.uid = uid
  }

  notify (nameForID) {
    return `<@${this.uid}>`
  }

  mention (nameForID) {
    return nameForID(this.uid) || `\`!${this.uid}\``
  }
}

class FreeInvitee extends Invitee {
  constructor (name) {
    super()
    this.name = name
  }

  notify (nameForID) {
    return this.name
  }

  mention (nameForID) {
    return this.name
  }
}

module.exports = {Invitee}
