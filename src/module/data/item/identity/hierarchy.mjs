import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Hierarchy type Items.
 */
export default class Hierarchy extends Identity {
	
	/* -------------------------------------------- */
	/*  Type Options                                */
	/* -------------------------------------------- */

	#typeOptions() {
		return {
			...super._typeOptions,
			type: 'hierarchy',
			unique: true,
			parentTypes: ['npc'],
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
		});
	}
	
	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */
	
	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */
	
	
	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */

	async _preCreate(data, options, user) {
		let allowed = super._preCreate(data, options, user);
		return allowed;
	}

	// _onCreate(data, options, userId) {}

	// async _preUpdate(changed, options, user) {}
	// _onUpdate(changed, options, userId) {}
}
