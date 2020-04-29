class RobotUserSource {
  constructor(robot) {
    this.robot = robot;
  }

  withUser(uid, callback) {
    const u = this.robot.brain.users()[uid];
    if (u) {
      return callback(u);
    } else {
      return undefined;
    }
  }

  nameForID(uid) {
    return this.withUser(uid, u => u.name);
  }

  emailForID(uid) {
    return this.withUser(uid, u => u.email_address);
  }
}

module.exports = {RobotUserSource};
