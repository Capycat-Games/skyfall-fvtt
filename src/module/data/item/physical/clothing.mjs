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
			sigils: new fields.ArrayField(new fields.SchemaField({
				uuid: new fields.StringField({required: true}, {validate: Clothing.validateUuid}),
				parentUuid: new fields.StringField({required: true}, {validate: Clothing.validateUuid}),
				infused: new fields.BooleanField({required:true, initial:false})
			}), {max: 4}),
		})
	}

	/** @inheritDoc */
	async _preUpdate(changed, options, user) {
		return await super._preUpdate(changed, options, user);
	}
}
