import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Curse type Items.
 */
export default class Curse extends Identity {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return super.defineSchema();
		return foundry.utils.mergeObject(super.defineSchema(), {
			// NÃO TEM NADA DE MAIS
		});
	}
}
