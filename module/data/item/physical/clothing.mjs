import PhysicalItemData from "./physical-item.mjs";

/**
 * Data schema, attributes, and methods specific to Clothing type Items.
 * Beneficios devem ser ActiveEffects
 */
export default class Clothing extends PhysicalItemData {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			...this.equippableSchema(),
			type: new fields.StringField({required: true, blank: true, choices: SYSTEM.clothings, initial: "head"}),
		})
	}
}
