
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
			return combatant.actor.rollInitiative();
		}
		return super._onCombatantControl(event);
	}
}