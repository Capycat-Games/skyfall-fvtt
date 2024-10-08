import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Feat type Items.
 */
export default class Feat extends Identity {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			origin: new fields.StringField({
				required: true,
				label: "SKYFALL.ITEM.ORIGIN"
			}, {validate: Identity.validateUuid}),
			requisites: new fields.StringField({
				required:true,
				blank: true,
				label: "SKYFALL.ITEM.REQUISITES"
			})
		});
	}
}
