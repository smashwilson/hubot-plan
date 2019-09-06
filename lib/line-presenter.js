const {Presenter} = require("./presenter");

class LinePresenter extends Presenter {
  constructor(...args) {
    super(...args);
    this.separator = "\n";
  }

  presentUnfinalized(evt) {
    let str = `\`${evt.getID()}\` _${evt.getName()}_`;
    const ps = evt.proposals.filter(Boolean);
    if (ps.length > 0) str += " ";
    str += ps.map(p => p.getTimespan().renderStart()).join(", ");
    return str;
  }

  presentFinalized(evt) {
    return `\`${evt.getID()}\` ${evt.getName()} ${evt
      .finalProposal()
      .getTimespan()
      .renderStart()}`;
  }
}

module.exports = {LinePresenter};
