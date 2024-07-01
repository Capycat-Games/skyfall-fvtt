import Ability from "./ability.mjs";

/**
 * Data schema, attributes, and methods specific to Spell type Items.
 */
export default class Spell extends Ability {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			type: new fields.StringField({required: true, blank: true, choices: SYSTEM.spells, initial: "", label: "SKYFALL2.Type"}),
			components: new fields.ArrayField(new fields.StringField({required:true, blank: false, label: "SKYFALL2.ComponentPl"})),
		});
	}
}
