import PhysicalItemData from "./physical-item.mjs";

/**
 * Data schema, attributes, and methods specific to Consumable type Items.
 */
export default class Consumable extends PhysicalItemData {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			type: new fields.StringField({required: true, blank: true, choices: SYSTEM.consumables, initial: "ammo"}),
			damage: new fields.StringField({required: true, blank: false}),
			uses: new fields.SchemaField({
				value: new fields.NumberField({
					required: true, min: 0, integer: true, label: "SKYFALL.ITEM.LIMITEDUSES"
				}),
				max: new fields.NumberField({required: true, min: 0, integer: true, label: "SKYFALL.ITEM.LimitedUsesMax"}),
				per: new fields.StringField({
					required: true, nullable: true, blank: false, initial: null, label: "SKYFALL.ITEM.LimitedUsesPer"
				}),
			}, {required: false}),
			// OPCIONAIS: ALCANCE | ALVO | ACERTO | DANO | EFEITO
		})
	}
}