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
			...this.equippableSchema(),
			/* simples | marciais | fogo | regional */
			category: new fields.StringField({required: true, blank: false, choices: SYSTEM.weapons, initial: "simple", label:"SKYFALL.ITEM.CATEGORY"}),
			/* uma mão | duas mãos */
			wield: new fields.NumberField({required: true, integer: true, choices:{1:"SKYFALL.WIELD.OneHand",2:"SKYFALL.WIELD.TwoHand"}, initial:1, label:"SKYFALL.ITEM.WIELD"}),
			damage: new fields.SchemaField({
				formula: new fields.StringField({required: true, blank: true, label:"SKYFALL.ITEM.DAMAGE"}),
				abl: new fields.StringField({required: true, blank: false, choices: SYSTEM.abilities, initial: "str", label:"SKYFALL.ACTOR.ABILITY"}),
			}),
			range: new fields.NumberField({required: true, min: 0, label:"SKYFALL.ITEM.RANGE"}),
		})
	}

	get isRanged(){
		return this.descriptors.includes('thrown') || this.descriptors.includes('shooting');
	}

	get isMelee(){
		return !this.descriptors.includes('shooting');
	}
}