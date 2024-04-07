import Antropologia from "./antropologia.mjs";

/**
 * Data schema, attributes, and methods specific to Curse type Items.
 */
export default class Curse extends Antropologia {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return super.defineSchema();
		return mergeObject(super.defineSchema(), {
			// NÃO TEM NADA DE MAIS
		});
	}
}
