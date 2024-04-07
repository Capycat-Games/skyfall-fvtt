import Antropologia from "./antropologia.mjs";

/**
 * Data schema, attributes, and methods specific to Path type Items.
 */
export default class Path extends Antropologia {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return mergeObject(super.defineSchema(), {
			type: new fields.StringField({required: true, choices:["specialized","war","mystic"], initial: "specialized"}),
			featuresAdv: new fields.SetField(new fields.StringField({required: true}, {validate: Antropologia.validateUuid})),
		});
	}
}
