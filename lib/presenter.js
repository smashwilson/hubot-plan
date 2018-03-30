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

  present (evt) {
    return evt.presentWith(this)
  }

  presentUnfinalized (evt) {
    //
  }

  presentFinalized (evt) {
    //
  }
}

module.exports = {Presenter}
