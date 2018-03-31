const nullUserSource = {
  nameForID: () => undefined,
  emailForID: () => undefined
}

class Presenter {
  constructor (options = {}) {
    this.now = options.now
    this.userSource = options.userSource || nullUserSource
    this.ping = options.ping
  }

  present (subject) {
    return subject.presentWith(this)
  }

  presentAll (evts) {
    return evts.map(evt => this.present(evt)).join('')
  }

  presentUnfinalized (evt) {
    //
  }

  presentFinalized (evt) {
    //
  }
}

module.exports = {Presenter}
