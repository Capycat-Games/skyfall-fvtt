
/**
 * An extension of the base CombatTracker class to override the default rollInitiative.
 * @extends {CombatTracker}
 */
export class CombatTrackerSkyfall extends CombatTracker {
	/** @inheritdoc */
	async _onCombatantControl(event) {
		const btn = event.currentTarget;
		const combatantId = btn.closest(".combatant").dataset.combatantId;
		const combatant = this.viewed.combatants.get(combatantId);
		if ( (btn.dataset.control === "rollInitiative") && combatant?.actor ) {
			const actor = combatant?.actor;
			if ( actor.type == 'npc' && actor.system.hierarchy == 'boss' ) {
				actor.rollInitiative({createCombatants:true});
				actor.rollInitiative({createCombatants:true});
				return actor.rollInitiative({createCombatants:true});
			} else {
				return actor.rollInitiative();
			}
		}
		return super._onCombatantControl(event);
	}
}