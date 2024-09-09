
/**
 * Data schema, attributes, and methods specific to TEMPLATE type Actors.
 */

export default class Template extends foundry.abstract.TypeDataModel {

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;

		return {
		}
	}
	
	static migrateData(source) {
		return super.migrateData(source);
	}

	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareBaseData() {
		
	}

	/** @inheritDoc */
	prepareDerivedData() {
	}


	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */

	async _preCreate(data, options, user) {}
	_onCreate(data, options, userId) {}
	async _preUpdate(changes, options, user) {}
	_onUpdate(changed, options, userId) {}

	
}