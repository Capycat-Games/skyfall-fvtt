import Identity from "./identity.mjs";
// import { MappingField } from "../../fields/mapping.mjs";
/**
 * Data schema, attributes, and methods specific to Legacy type Items.
 */
export default class Legacy extends Identity {
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
				melancholy: new fields.HTMLField({required: true, blank: true}),
			}),
			heritages: new _fields.MappingField(new fields.SchemaField({
				name: new fields.StringField({required: true, blank: false}),
				description: new fields.HTMLField({required: true, blank: true}),
				features: new fields.SetField(new fields.StringField({required: true}, {validate: Identity.validateUuid})),
				chosen: new fields.BooleanField({required: true, default: false}),
			})),
		});
	}
	/* ------------------------------ */
	
	get heritage(){
		return Object.values(this.heritages).find( h => h.chosen )?.name ?? ' NA '
	}
	
	someFunction(data){
		if ( this.parent ) return this.parent;
	}
}
