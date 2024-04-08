import Antropologia from "./antropologia.mjs";

/**
 * Data schema, attributes, and methods specific to Feat type Items.
 */
export default class Feat extends Antropologia {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			origin: new fields.StringField({required: true}, {validate: Antropologia.validateUuid}),
			requisites: new fields.StringField({required:true, blank: true})
			// requisitos: new fields.ArrayField(new fields.StringField({required:true, blank: true})),
		});
	}
}
