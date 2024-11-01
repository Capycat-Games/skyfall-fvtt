import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Feature type Items.
 */
export default class Feature extends Identity {
	
	/* -------------------------------------------- */
	/*  Type Options                                */
	/* -------------------------------------------- */

	#typeOptions() {
		return {
			...super._typeOptions,
			type: 'feature',
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
			catharsis: new fields.BooleanField({required: true, initial: false, label:"SKYFALL2.Catharsis"}),
		})
	}
	
	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */
	
	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */

}
