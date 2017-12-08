module.exports = {
  register (robot, msg, yargs) {
    const userTz = msg.message.user.tz || 'America/New_York'
    const now = robot['hubot-events'].now(userTz)

    function wrapHandler (h) {
      return argv => {
        robot['hubot-events'].withStore(async store => {
          try {
            const context = {robot, msg, userTz, now, store}
            await h(context, argv)
          } catch (e) {
            if (e.reply) {
              msg.send(`:rotating_light: ${e.reply}`)
            } else {
              msg.send(`:boom:\n${e.stack}`)
            }
          }
        })
      }
    }

    function createCommandModule (m) {
      return {
        command: m.command,
        description: m.description,
        builder: m.builder,
        handler: wrapHandler(m.handler)
      }
    }

    return ['./create', './edit'].reduce((y, fileName) => {
      return y.command(createCommandModule(require(fileName)))
    }, yargs)
  }
}
