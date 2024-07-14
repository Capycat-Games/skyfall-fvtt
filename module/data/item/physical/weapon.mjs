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
			category: new fields.StringField({required: true, blank: false, choices: SYSTEM.weapons, initial: "simple", label:"Categoria"}),
			/* uma mão | duas mãos */
			wield: new fields.NumberField({required: true, integer: true, choices:{1:"SKYFALL2.WIELD.OneHand",2:"SKYFALL2.WIELD.TwoHand"}, initial:1, label:"SKYFALL2.Wield"}),
			damage: new fields.SchemaField({
				formula: new fields.StringField({required: true, blank: true, label:"SKYFALL2.Damage"}),
				abl: new fields.StringField({required: true, blank: false, choices: SYSTEM.abilities, initial: "str", label:"SKYFALL.ACTOR.ABILITY"}),
			}),
			range: new fields.NumberField({required: true, min: 0, label:"SKYFALL2.Range"}),
			sigils: new fields.ArrayField(new fields.SchemaField({
				uuid: new fields.StringField({required: true}, {validate: Weapon.validateUuid}),
				parentUuid: new fields.StringField({required: true}, {validate: Weapon.validateUuid}),
				infused: new fields.BooleanField({required:true, initial:false})
			}), {max: 4}),
		})
	}

	get isRanged(){
		return this.descriptors.includes('thrown') || this.descriptors.includes('shooting');
	}

	get isMelee(){
		return !this.descriptors.includes('shooting');
	}

	get fullName(){
		return this.parent.name;
	}
}