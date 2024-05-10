import PhysicalItemData from "./physical-item.mjs";

/**
 * Data schema, attributes, and methods specific to Weapon type Items.
 */
export default class Weapon extends PhysicalItemData {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			/* simples | marciais | fogo | regional */
			category: new fields.StringField({required: true, blank: false, choices: SYSTEM.weapons, initial: "simple"}),
			/* uma mão | duas mãos */
			wield: new fields.NumberField({required: true, integer: true, min: 1, max: 2}),
			damage: new fields.SchemaField({
				formula: new fields.StringField({required: true, blank: true}),
				abl: new fields.StringField({required: true, blank: false, choices: SYSTEM.abilities, initial: "str"}),
			}),
			range: new fields.NumberField({required: true, min: 0}),
		})
	}
}