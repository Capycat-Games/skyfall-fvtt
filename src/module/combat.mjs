
/**
 * An extension of the base CombatTracker class to override the default rollInitiative.
 * @extends {CombatTracker}
 */
export class CombatTrackerSkyfall extends foundry.applications.sidebar.tabs.CombatTracker {
	/** @inheritdoc */
	async _onCombatantControl(event, target) {
		if (target.dataset.action === "rollInitiative") {
			console.log(event, target);
			const combatantId = target.closest(".combatant").dataset.combatantId;
			const combatant = this.viewed.combatants.get(combatantId);
			const { ModificationConfig } = skyfall.applications;
			const combat = combatant.parent;
			const combatants = combat.combatants.filter(i => i.actorId == combatant.actorId);
			for (const combatant of combatants) {
				if (combatant.initiative != null) continue;

				const MODCONFIG = await ModificationConfig.fromData({
					actor: combatant.actor.uuid,
					ability: 'dex',
					check: {
						type: "initiative",
						id: "dex",
						abl: "dex",
						abilities: ["dex"],
						ability: "dex"
					},
					rollconfig: {
						rollmode: (event.altKey ? 'disadvantage' : (event.ctrlKey ? 'advantage' : null)),
					},
					appliedMods: [],
					effects: [],
				});
				MODCONFIG.render(true);
			}
			return;
		}
		return super._onCombatantControl(event);
	}
}

