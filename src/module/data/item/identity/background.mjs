import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Background type Items.
 */
export default class Background extends Identity {
		
	/* -------------------------------------------- */
	/*  Type Options                                */
	/* -------------------------------------------- */

	#typeOptions() {
		return {
			...super._typeOptions,
			type: 'background',
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
		return foundry.utils.mergeObject(super.defineSchema(), {
			traits: new fields.SchemaField({
				proficiencies: new fields.StringField({required: true, blank: true, label:"Proficiência"}),
				languages: new fields.StringField({required: true, blank: true, label:"Idiomas"}),
				equipment: new fields.StringField({required: true, blank: true, label:"Equipamento"}),
				event: new fields.StringField({required: true, blank: true, label:"Evento Marcante"}),
			}),
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
		this.parent.updateSource({'system.origin': ['background']})
		return true;
	}
}
