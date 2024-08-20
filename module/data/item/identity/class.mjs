import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Class type Items.
 */
export default class Class extends Identity {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const choices = { 
			hitDie: {"1d6":"1d6","1d8":"1d8","1d10":"1d10"}
		}
		return foundry.utils.mergeObject(super.defineSchema(), {
			level: new fields.NumberField({required:true, integer: true, min: 1, max: 12, initial: 1}),
			initial: new fields.BooleanField({required: true, initial:false, label:"Inicial"}),
			hitDie2: new fields.StringField({required: true, choices:["1d6","1d8","1d10"], initial: "1d6"}),
			hitDieLevel: new fields.ArrayField(new fields.NumberField({required: true, interger:true})),
			hitDie: new fields.SchemaField({
				value: new fields.NumberField({required: true, interger:true, initial: 0}),
				max: new fields.NumberField({required: true, interger:true, initial: 0}),
				die: new fields.StringField({required: true, choices:choices.hitDie, initial: "1d6"}),
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
			guild: new fields.SchemaField({
				ability: new fields.StringField({required: true, blank: true, choices: {
					cunning: {value:'cunning', label:"SKYFALL2.GUILD.Cunning"},
					knowledge: {value:'knowledge', label:"SKYFALL2.GUILD.Knowledge"},
					crafting: {value:'crafting', label:"SKYFALL2.GUILD.Crafting"},
					// reputation: {value:'reputation', label:"SKYFALL2.GUILD.Reputation"},
				}, initial: "cunning", label:"SKYFALL2.GUILD.GuildAbility"}),
			})
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

	static migrateData(source) {
		
	}

	
	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareBaseData() {
		this.hitDie.max = this.level;
	}

}