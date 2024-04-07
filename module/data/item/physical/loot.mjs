import PhysicalItemData from "./physical-item.mjs";

/**
 * Data schema, attributes, and methods specific to Loot type Items.
 */
export default class Loot extends PhysicalItemData {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */
	
	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			/* arte | material-especial */
			type: new fields.StringField({required: true, blank: true, choices: SYSTEM.loots, initial: "coin"}),
		})
	}
}
