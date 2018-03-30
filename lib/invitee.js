class Invitee {
  static withUID (uid) {
    return new UserInvitee(uid)
  }

  static free (name) {
    return new FreeInvitee(name)
  }

  static deserialize (payload) {
    const Constructor = {user: UserInvitee, free: FreeInvitee}[payload.kind]
    if (!Constructor) {
      throw new Error(`Invalid kind: ${payload.kind}`)
    }
    return new Constructor(payload.value)
  }
}

class UserInvitee extends Invitee {
  constructor (uid) {
    super()
    this.uid = uid
  }

  notify (source) {
    return `<@${this.uid}>`
  }

  mention (source) {
    return source.nameForID(this.uid) || `\`!${this.uid}\``
  }

  email (source) {
    return source.emailForID(this.uid) || `${this.uid}@slack-id.com`
  }

  show () {
    return this.uid
  }

  getKey () {
    return `u:${this.uid}`
  }

  serialize () {
    return {kind: 'user', value: this.uid}
  }
}

class FreeInvitee extends Invitee {
  constructor (name) {
    super()
    this.name = name
  }

  notify (source) {
    return this.name
  }

  mention (source) {
    return this.name
  }

  email (source) {
    return this.name
  }

  show () {
    return this.name
  }

  getKey () {
    return `f:${this.name}`
  }

  serialize () {
    return {kind: 'free', value: this.name}
  }
}

module.exports = {Invitee}
