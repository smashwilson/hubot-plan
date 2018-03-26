class Presenter {
  constructor (options = {}) {
    this.now = options.now
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
