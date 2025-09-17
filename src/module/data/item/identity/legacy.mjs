import Identity from "./identity.mjs";
// import { MappingField } from "../../fields/mapping.mjs";
/**
 * Data schema, attributes, and methods specific to Legacy type Items.
 */
export default class Legacy extends Identity {
	
	/* -------------------------------------------- */
	/*  Type Options                                */
	/* -------------------------------------------- */

	#typeOptions() {
		return {
			...super._typeOptions,
			type: 'legacy',
			unique: true,
			parentTypes: ['character'],
			benefitTypes: {feature: [], heritage: [], grant: []},
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
		const _fields = skyfall.data.fields;
		
		return foundry.utils.mergeObject(super.defineSchema(), {
			traits: new fields.SchemaField({
				age: new fields.HTMLField({required: true, blank: true}),
				movement: new fields.HTMLField({required: true, blank: true}),
				size: new fields.HTMLField({required: true, blank: true}),
				melancholy: new fields.HTMLField({required: true, blank: true}), // DEPRECATE
			}),
			heritages: new _fields.MappingField(new fields.SchemaField({
				name: new fields.StringField({required: true, blank: false}),
				description: new fields.HTMLField({required: true, blank: true}),
				features: new fields.SetField(new fields.StringField({required: true}, {validate: Identity.validateUuid})),
				chosen: new fields.BooleanField({required: true, default: false}),
			})),
		});
	}
	
	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */
	
	
	/* -------------------------------------------- */
	
	/* -------------------------------------------- */
	/*  Getters & Setters                           */
	/* -------------------------------------------- */
	
	get heritage(){ // DEPRECATE
		return Object.values(this.heritages).find( h => h.chosen )?.name ?? ' NA '
	}
	
	/* -------------------------------------------- */
	/*  Type Methods                                */
	/* -------------------------------------------- */
	
	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */
	
	async _preCreate(data, options, user) {
		let allowed = super._preCreate(data, options, user);
		return allowed;
	}

	async identityOrigin() {
		if ( !this.parent.isEmbedded ) return true;
		this.parent.updateSource({'system.origin': ['legacy']})
		return true;
	}
}
