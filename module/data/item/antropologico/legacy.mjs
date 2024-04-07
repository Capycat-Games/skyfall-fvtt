import Antropologia from "./antropologia.mjs";
import { MappingField } from "../../fields/mapping.mjs";
/**
 * Data schema, attributes, and methods specific to Legacy type Items.
 */
export default class Legacy extends Antropologia {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return mergeObject(super.defineSchema(), {
			traits: new fields.SchemaField({
				age: new fields.HTMLField({required: true, blank: true}),
				movement: new fields.HTMLField({required: true, blank: true}),
				size: new fields.HTMLField({required: true, blank: true}),
				melancholy: new fields.HTMLField({required: true, blank: true}),
			}),
			heritages: new MappingField(new fields.SchemaField({
				name: new fields.StringField({required: true, blank: false}),
				description: new fields.HTMLField({required: true, blank: true}),
				features: new fields.SetField(new fields.StringField({required: true}, {validate: Antropologia.validateUuid})),
				chosen: new fields.BooleanField({required: true, default: false}),
			})),
		});
	}
}
