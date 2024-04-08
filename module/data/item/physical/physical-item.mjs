
/**
 * Data schema, attributes, and methods commom to PhysicalItemData type Items.
 */
export default class PhysicalItemData extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			description: new fields.SchemaField({
				value: new fields.HTMLField({required: true, blank: true}),
			}),
			unidentified: new fields.SchemaField({
				value: new fields.BooleanField({initial: false}),
				name: new fields.StringField({required:true, blank: true, label: "SKYFALL.ITEM.NameUnidentified"}),
				description:  new fields.HTMLField({required: true, blank: true, label: "SKYFALL.ITEM.DescriptionUnidentified"})
			}),
			descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false})),
			quantity: new fields.NumberField({required: true, integer: true, min: 0, initial:1}),
			price: new fields.NumberField({required: true, integer: true, min: 0}),
			capacity: new fields.NumberField({required: true, integer: true, min: 0}),
			equipped: new fields.BooleanField({initial: false}),
			attuned: new fields.BooleanField({initial: false}),
		}
	}
}