import PhysicalItemData from "./physical-item.mjs";

/**
 * Data schema, attributes, and methods specific to Equipment type Items.
 */
export default class Equipment extends PhysicalItemData {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			type: new fields.StringField({required: true, blank: true, choices: SYSTEM.consumables, initial: "municao"}),
			uses: new fields.SchemaField({
				value: new fields.NumberField({
					required: true, min: 0, integer: true, label: "SKYFALL.ITEM.LIMITEDUSES"
				}),
				max: new fields.NumberField({required: true, min: 0, integer: true, label: "SKYFALL.ITEM.LimitedUsesMax"}),
				per: new fields.StringField({
					required: true, nullable: true, blank: false, initial: null, label: "SKYFALL.ITEM.LimitedUsesPer"
				}),
			}, {required: false}),
		})
	}
}