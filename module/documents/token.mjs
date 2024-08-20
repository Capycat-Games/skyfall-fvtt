export default class SkyfallToken extends TokenDocument {

  /** @override */
  static getTrackedAttributes(data, _path=[]) {
    return {
      bar: [
        ["resource", "hp"],
        ["resource", "ep"],
        ["resource", "shadow"],
      ],
      value: []
    }
  }

  /**
   * An indicator for whether this Token is currently involved in the active combat encounter.
   * @type {boolean}
   */
  get inCombat() {
    const boss = this.actor?.type == 'npc' && this.actor?.system.hierarchy == 'boss';
    if ( boss && game.combats.active ) {
      const combatants = game.combats.active.combatants.filter(c => c.tokenId == this.id );
      return combatants.length == 3;
    } else return !!this.combatant;
  }
}
