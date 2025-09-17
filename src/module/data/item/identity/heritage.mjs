import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Heritage type Items.
 */
export default class Heritage extends Identity {
	
	/* -------------------------------------------- */
	/*  Type Options                                */
	/* -------------------------------------------- */

	#typeOptions() {
		return {
			...super._typeOptions,
			type: 'heritage',
			unique: false,
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
		return foundry.utils.mergeObject(super.defineSchema(), {
			
		});
	}
	
	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */
	

	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */
	
}
