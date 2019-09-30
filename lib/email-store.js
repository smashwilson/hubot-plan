const {RobotUserSource} = require("./robot-user-source");

class UserEmailStore {
  constructor(uid, userSource) {
    this.uid = uid;
    this.userSource = userSource;
    this.known = new Set();
    this.default = null;
  }

  add(email, becomeDefault) {
    if (becomeDefault || (!this.getDefault() && this.known.size === 0)) {
      this.default = email;
    }
    this.known.add(email);
  }

  remove(email) {
    if (this.getSlackProvided() === email) {
      const e = new Error("Unable to remove email address");
      e.reply = `Cannot remove your Slack-provided email address.`;
      throw e;
    }

    if (this.default === email) {
      const fallback = this.getKnown().filter(each => each !== email);
      if (fallback.length === 1) {
        this.default = fallback[0];
      } else if (this.getSlackProvided() !== null) {
        this.default = this.getSlackProvided();
      } else {
        const e = new Error("Unable to remove email address");
        e.reply = `Cannot remove your default email address without a clear fallback.`;
        throw e;
      }
    }

    this.known.delete(email);
  }

  getSlackProvided() {
    return this.userSource.emailForID(this.uid);
  }

  getDefault() {
    return this.default || this.getSlackProvided();
  }

  getKnown() {
    const all = new Set();
    const slackEmail = this.getSlackProvided();
    if (slackEmail) {
      all.add(slackEmail);
    }
    for (const email of this.known) {
      all.add(email);
    }
    return Array.from(all);
  }
}

class EmailStore {
  constructor(robot) {
    this.userSource = new RobotUserSource(robot);

    this.byID = new Map();
  }

  add(uid, email, becomeDefault = false) {
    this.getUserStore(uid).add(email, becomeDefault);
  }

  remove(uid, email) {
    this.getUserStore(uid).remove(email);
  }

  known(uid) {
    return this.getUserStore(uid).getKnown();
  }

  getDefault(uid) {
    return this.getUserStore(uid).getDefault();
  }

  getSlackProvided(uid) {
    return this.getUserStore(uid).getSlackProvided();
  }

  getUserStore(uid) {
    let store = this.byID.get(uid);
    if (!store) {
      store = new UserEmailStore(uid, this.userSource);
      this.byID.set(uid, store);
    }
    return store;
  }
}

module.exports = {EmailStore};
