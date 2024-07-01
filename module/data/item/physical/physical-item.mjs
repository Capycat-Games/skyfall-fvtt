
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
				value: new fields.HTMLField({required: true, blank: true, label:"SKYFALL.DESCRIPTION"}),
			}),
			unidentified: new fields.SchemaField({
				value: new fields.BooleanField({initial: false, label:"SKYFALL.UNIDENTIFIED"}),
				name: new fields.StringField({required:true, blank: true, label: "SKYFALL.NameUnidentified"}),
				description:  new fields.HTMLField({required: true, blank: true, label: "SKYFALL.DescriptionUnidentified"})
			}),
			descriptors: new fields.ArrayField(new fields.StringField({required:true, blank: false}),{label:"SKYFALL.DESCRIPTORS"}),
			quantity: new fields.NumberField({required: true, integer: true, min: 0, initial:1, label:"SKYFALL.QUANTITY"}),
			price: new fields.NumberField({required: true, integer: true, min: 0, label:"SKYFALL.PRICE"}),
			capacity: new fields.NumberField({required: true, integer: true, min: 0, label:"SKYFALL.CAPACITY"}),
			
		}
	}

	static equippableSchema(){
		const fields = foundry.data.fields;
		return {
			equipped: new fields.BooleanField({initial: false, label:"SKYFALL.EQUIPPED"}),
			attuned: new fields.BooleanField({initial: false, label:"SKYFALL.ATTUNED"}),
			favorite: new fields.BooleanField({initial: false, label:"SKYFALL.FAVORITE"}),
		}
	}
}