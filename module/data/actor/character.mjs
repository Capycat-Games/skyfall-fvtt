import { MappingField } from "../fields/mapping.mjs";

const fields = foundry.data.fields;

/**
 * Data schema, attributes, and methods specific to Personagem type Items.
 */

export default class Character extends foundry.abstract.TypeDataModel {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		return {
			abilities: new MappingField(new foundry.data.fields.SchemaField({
				value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: -3, max: 5}),
				protection: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0}),
				proficient: new fields.BooleanField({initial: false}),
				initiative:  new fields.BooleanField({initial: false}),
			}), {
				initialKeys: SYSTEM.abilities,
				initialKeysOnly: true, label: "SKYFALL.Abilities"
			}),
			attributes: new fields.SchemaField({
				// HP, DEATH, init, movement, attunement, senses, spellcasting, exhaustion
			}),
			resources: new fields.SchemaField({
				hp: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0}),
					max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1}),
					temp: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0}),
				}),
				ep: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0}),
					max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1}),
					temp: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0}),
				}),
				hitDie: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0}),
					max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1}),
					die: new fields.StringField({required: true, blank: false, initial: '1d6'}),
				}),
				catharsis: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, max: 5}),
				}),
				shadow: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 5, min: 0, max: 5}),
				}),
			}),
			death: new fields.SchemaField({
				success: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0,  max: 3}),
				failure: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0,  max: 3}),
			}),
			skills: new MappingField(new foundry.data.fields.SchemaField({
				value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, max:2}),
				other: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0}),
				bonuses: new fields.ArrayField(new fields.StringField({})),
				custom: new fields.BooleanField({initial: false}),
				label: new fields.StringField({required: true}),
			}), {
				initialKeys: SYSTEM.skills, 
				initialKeysOnly: false, label: "SKYFALL.ACTOR.SKILLPLURAL"
			}),
			proficiency: new fields.NumberField({required: true, nullable: false, integer: true, initial: 2}), //REMOVE
			proficiencies: new fields.ArrayField(new fields.StringField({choices: SYSTEM.proficiencies})),
			languages: new fields.ArrayField(new fields.StringField({choices: SYSTEM.languages})),
			dr: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0}),
			modifiers: new fields.SchemaField({
				damage: new fields.SchemaField({
					taken: this.#schemaDamage(),
					dealt: this.#schemaDamage(),
				}),
				condition: new fields.SchemaField({
					imune: new fields.ArrayField(new fields.StringField({choices: SYSTEM.STATUSEFFECTS})),
					protected: new fields.ArrayField(new fields.StringField({choices: SYSTEM.STATUSEFFECTS})),
				}),
				descriptor: new fields.SchemaField({
					imune: new fields.ArrayField(new fields.StringField({choices: SYSTEM.DESCRIPTORS})),
					protected: new fields.ArrayField(new fields.StringField({choices: SYSTEM.STATUSEFFECTS})),
				}),
			}),
			level:  new fields.SchemaField({
				value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1,  max: 12}),
				xp: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 0}), 
			}),
			movement: new fields.SchemaField({
				walk: new fields.NumberField({required: true, nullable: false, initial: 9, min: 0}),
				swim: new fields.NumberField({required: true, nullable: false, initial: 0, min: 0}),
				burrow: new fields.NumberField({required: true, nullable: false, initial: 0, min: 0}),
				flight: new fields.NumberField({required: true, nullable: false, initial: 0, min: 0}),
				str: new fields.NumberField({required: true, nullable: false, initial: 0, min: 0}),
				dex: new fields.NumberField({required: true, nullable: false, initial: 0, min: 0}),
			}),
			size: new fields.StringField({choices: SYSTEM.SIZE, initial:"med"}),
			currency: new fields.SchemaField({
				t: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0}),
				p: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0}),
				k: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0}),
			}),
			capacity: new fields.SchemaField({
				value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0}),
				max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1}),
			}),
			fragments: new fields.SchemaField({
				abl: new fields.StringField({choices: SYSTEM.abilities, initial:"cha"}),
				value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0}),
				max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1}),
			}),
			creatureType: new fields.StringField({choices: SYSTEM.creatureType}),
			details: new fields.SchemaField({
				pronouns: new fields.StringField(),
				player: new fields.StringField(),
			}),
			spelcasting: new fields.StringField({choices: SYSTEM.abilities, initial:"int"}),
		}
	}

	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */

	static #schemaDamage() {
		const dmgResLevels = Object.keys(SYSTEM.damageModifiers);
		const dmgTypes = Object.values(SYSTEM.DESCRIPTOR.DAMAGE);
		return new fields.SchemaField( dmgTypes.reduce((obj, dmg) => {
			obj[dmg.id] = new fields.StringField({choices: dmgResLevels, initial: "nor"});
			return obj;
		}, {}));
	}

	static migrateData(source) {
		return super.migrateData(source);
	}
	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */
	
	/** @override */
	prepareData() {
		super.prepareData();
		console.log("DATAMODEL.prepareData()");
	}

	/** @override */
	prepareBaseData() {
		console.log("DATAMODEL.prepareBaseData()");
		console.log(this);
		const level = this.level.value;
		this.proficiency = (level >= 9 ? 4 : (level >= 5 ? 3 : 2));
		
	}

	/**
	 * @override
	 */
	prepareDerivedData() {
		console.log("DATAMODEL.prepareDerivedData()");
	}
}