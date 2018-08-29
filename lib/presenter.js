const nullUserSource = {
  nameForID: () => undefined,
  emailForID: () => undefined
}

class Presenter {
  constructor (options = {}) {
    this.now = options.now
    this.userSource = options.userSource || nullUserSource
    this.ping = options.ping
    this.separator = ''
  }

  present (subject) {
    return subject.presentWith(this)
  }

  presentAll (evts) {
    return evts.map(evt => evt.presentWith(this)).join(this.separator)
  }

  presentUnfinalized (evt) {
    //
  }

  presentFinalized (evt) {
    //
  }
}

module.exports = { Presenter }
