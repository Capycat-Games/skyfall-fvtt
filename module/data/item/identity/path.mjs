import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Path type Items.
 */
export default class Path extends Identity {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			type: new fields.StringField({required: true, choices:SYSTEM.pathTypes, initial: "specialized",label: "SKYFALL2.Type"}),
			featuresAdv: new fields.SetField(new fields.StringField({required: true}, {validate: Identity.validateUuid})),
		});
	}
}
