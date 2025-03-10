
/**
 * Data schema, attributes, and methods specific to Seal type Items.
 */

export default class Seal extends foundry.abstract.TypeDataModel {

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;

		return {
			description: new fields.SchemaField({
				value: new fields.HTMLField({required: true, blank: true, label:"SKYFALL2.Description"}),
			}),
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
	prepareData() {
		super.prepareData();
	}

	/** @inheritDoc */
	prepareBaseData() {
		
	}

	/** @inheritDoc */
	prepareDerivedData() {
	}

	/* -------------------------------------------- */
	/*  System Methods                              */
	/* -------------------------------------------- */

	getRollData() {
		return {}
	}
}