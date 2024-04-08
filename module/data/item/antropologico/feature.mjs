import Antropologia from "./antropologia.mjs";

/**
 * Data schema, attributes, and methods specific to Feature type Items.
 */
export default class Feature extends Antropologia {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			origin: new fields.StringField({required: true}, {validate: Antropologia.validateUuid}),
		})
	}
}
