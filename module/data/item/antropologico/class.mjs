import Antropologia from "./antropologia.mjs";

/**
 * Data schema, attributes, and methods specific to Class type Items.
 */
export default class Class extends Antropologia {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return foundry.utils.mergeObject(super.defineSchema(), {
			level: new fields.NumberField({required:true, integer: true, min: 1, max: 12}),
			initial: new fields.BooleanField({required: true, initial:false}),
			hitDie: new fields.StringField({required: true, choices:["1d6","1d8","1d10"], initial: "1d6"}),
			hitDieLevel: new fields.ArrayField(new fields.NumberField({required: true, interger:true})),
			hitDie2: new fields.SchemaField({
				value: new fields.NumberField({required: true, interger:true}),
				max: new fields.NumberField({required: true, interger:true}),
				die: new fields.StringField({required: true, choices:["1d6","1d8","1d10"], initial: "1d6"}),
			}),
			spellcasting : new fields.StringField({required: true, blank: true, choices: SYSTEM.abilities , initial: ""}),
			proficiencies: new fields.SchemaField({
				armor: this.grantedSchema(),
				weapon: this.grantedSchema(),
				aptitude: this.grantedSchema(),
				language: this.grantedSchema(),
				skills: this.grantedSchema(),
				gear: this.grantedSchema(),
			}),
		});
	}

	static grantedSchema(options={}){
		const fields = foundry.data.fields;
		return new fields.SchemaField({
			descriptive: new fields.StringField({required: true, blank: true}),
			granted: new fields.StringField({required: true, blank: true}),
			amount: new fields.NumberField({required:true, integer: true, min: 0}),
			choices: new fields.ArrayField(new fields.StringField({required: true, blank: true})),
			chosen: new fields.ArrayField(new fields.StringField({required: true, blank: true})),
		});
	}
}