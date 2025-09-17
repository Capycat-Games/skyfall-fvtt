import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Curse type Items.
 */
export default class Curse extends Identity {
	
	/* -------------------------------------------- */
	/*  Type Options                                */
	/* -------------------------------------------- */

	#typeOptions() {
		return {
			...super._typeOptions,
			type: 'curse',
			unique: true,
			parentTypes: ['character'],
			benefitTypes: {feature: [], grant: []},
		}
	}
	
	get _typeOptions () {
		return this.#typeOptions();
	}

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
	
	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */


	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */

	async identityOrigin() {
		if ( !this.parent.isEmbedded ) return true;
		this.parent.updateSource({'system.origin': ['curse']})
		return true;
	}
}
