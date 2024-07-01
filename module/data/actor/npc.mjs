import Creature from "./creature.mjs";
/**
 * Data schema, attributes, and methods specific to Ancestry type Items.
 */

export default class NPC extends Creature {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return Object.assign(super.defineSchema(), {
			hierarchy: new fields.StringField({required:true, choices: SYSTEM.hierarchy, initial:'complex', blank:true, label:"SKYFALL.DM.HIERARCHY"}),
			archetype: new fields.SetField(new fields.StringField({required:true, choices: SYSTEM.archetype, initial:'brute'}),{label:"SKYFALL.DM.ARCHETYPE"}),
		});
	}
}
