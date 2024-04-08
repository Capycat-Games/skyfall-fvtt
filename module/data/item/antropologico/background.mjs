import Antropologia from "./antropologia.mjs";

/**
 * Data schema, attributes, and methods specific to Background type Items.
 */
export default class Background extends Antropologia {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			traits: new fields.SchemaField({
				proficiencies: new fields.StringField({required: true, blank: true}),
				languages: new fields.StringField({required: true, blank: true}),
				equipment: new fields.StringField({required: true, blank: true}),
				event: new fields.StringField({required: true, blank: true}),
			}),
		});
	}
}
