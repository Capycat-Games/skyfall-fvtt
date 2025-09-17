
export default class RollConfiguration extends foundry.abstract.DataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		
		return {
			rollMode: new fields.StringField({required: true, choices:CONFIG.Dice.rollModes, initial: "publicroll", label: "CHAT.RollVisibility"}),
			terms: new fields.ArrayField(new fields.SchemaField({
				label: new fields.StringField({required: true, initial: "", label: ""}),
				flavor: new fields.StringField({required: true, initial: "", label: ""}),
				active: new fields.BooleanField({initial: true}),
				expression: new fields.StringField({required: true, initial: "", label: ""}),
				preview: new fields.StringField({required: true, initial: "", label: ""}),
			})),
			transformers: new fields.ArrayField(new fields.SchemaField({
				label: new fields.StringField({required: true, initial: "", label: ""}),
				flavor: new fields.StringField({required: true, initial: "", label: ""}),
				active: new fields.BooleanField({initial: true}),
				expression: new fields.StringField({required: true, initial: "", label: ""}),
				target: new fields.StringField({required: true, initial: "", label: ""}),
				source: new fields.StringField({required: true, initial: "", label: ""}),
			}))
		}
	}
}