import PhysicalItemData from "./physical-item.mjs";

/**
 * Data schema, attributes, and methods specific to Armor type Items.
 */
export default class Armor extends PhysicalItemData {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			...this.equippableSchema(),
			/* leve | pesada | escudo */
			type: new fields.StringField({required: true, blank: true, choices: SYSTEM.armors, initial: "light", label:"SKYFALL2.Type"}),
			dr: new fields.NumberField({required: true, integer: true, min: 0, label:"SKYFALL2.DamageReduction"}),
			
			/* simples | marciais | fogo | regional */
			category: new fields.StringField({required: true, blank: false, choices: SYSTEM.weapons, initial: "simple", label:"SKYFALL2.Category"}),
			/* uma mão | duas mãos */
			damage: new fields.SchemaField({
				formula: new fields.StringField({required: true, blank: true, label:"SKYFALL2.Damage"}),
				abl: new fields.StringField({required: true, blank: false, choices: SYSTEM.abilities, initial: "str"}),
			}),
		})
	}

	get isShield() {
		return this.type == 'shield';
	}
}
