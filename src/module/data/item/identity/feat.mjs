import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Feat type Items.
 */
export default class Feat extends Identity {
	
	/* -------------------------------------------- */
	/*  Type Options                                */
	/* -------------------------------------------- */

	#typeOptions() {
		return {
			...super._typeOptions,
			type: 'feat',
			unique: false,
			parentTypes: ['character','npc','partner','creation'],
			benefitTypes: {feature: [], ability: [], grant: []},
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
			requisites: new fields.StringField({
				required:true,
				blank: true,
				label: "SKYFALL.ITEM.REQUISITES"
			})
		});
	}

	
	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */


	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */

}
