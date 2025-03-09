import Creature from "./creature.mjs";

/**
 * Data schema, attributes, and methods specific to Partner type Actors.
 */
export default class Partner extends Creature {

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */
	
	static get OPTIONS() {
		return {
			abilities: {
				mental: SYSTEM.abilities.mental,
				physical: SYSTEM.abilities.physical,
			}
		}
	}

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		const OPTIONS = this.OPTIONS;
		
		return Object.assign( super.defineSchema(), {
			abilities: new _fields.MappingField( this.schemaAbility(), {
				initialKeys: OPTIONS.abilities,
				initialKeysOnly: true, label: "SKYFALL2.AbilityPl"
			}),
			capacity: new fields.SchemaField({
				value: new fields.NumberField({
					required: true,
					nullable: false,
					integer: true,
					initial: 0,
					min: 0,
					label: "SKYFALL2.Current"
				}),
				max: new fields.NumberField({
					required: true,
					nullable: false,
					integer: true,
					initial: 1,
					min: 1,
					label: "SKYFALL2.Total"
				}),
				bonus: new fields.ArrayField(
					new fields.StringField({
						initial: '',
					}), {
						label: "SKYFALL2.Bonus"	
				}),
				bonusTotal: new fields.ArrayField(
					new fields.StringField({
						initial: '',
					}), {
						label: "SKYFALL2.Bonus"	
				}),
				ability: new fields.StringField({
					blank: true,
					choices: OPTIONS.abilities,
					initial: "",
					label: "SKYFALL2.Ability"
				}),
			}),
			resources: new fields.SchemaField({
				hc: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, label: "SKYFALL2.Current"}),
					max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1, label: "SKYFALL2.Total"}),
					temp: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL2.Temporary"}),
				}),
			}),
			spellcasting: new fields.StringField({choices: OPTIONS.abilities, initial:"mental", label: "SKYFALL2.ABILITY.Spellcasting"}),
		});
	}
	
	static migrateData(source) {
		return super.migrateData(source);
	}

	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareBaseData() {
		const level = this.level.value;
		this.proficiency = (level >= 10 ? 4 : (level >= 5 ? 3 : 2 ));
		// this.resources.hc.max = (level >= 10 ? 4 : (level >= 5 ? 3 : 2 ));
		const protection = {
			good: (level >= 10 ? 18 : (level >= 5 ? 15 : 12 )),
			bad: (level >= 10 ? 16 : (level >= 5 ? 13 : 10 )),
		}
		
		if ( this.abilities.physical.value > this.abilities.mental.value ) {
			this.abilities.physical.protection = protection.good;
			this.abilities.mental.protection = protection.bad;
		} else {
			this.abilities.mental.protection = protection.good;
			this.abilities.physical.protection = protection.bad;
		}

		const attack = (level >= 10 ? 8 : (level >= 5 ? 6 : 4 ));
		const damage = (level >= 10 ? '3d6+6' : (level >= 5 ? '2d6+4' : '1d6+2' ));
	}

	/** @inheritDoc */
	prepareDerivedData() {
		this.prepareSkillBonuses();
	}

	getRollData() {
		const data = super.getRollData();
		const OPTIONS = Partner.OPTIONS;

		for (const [key, abl] of Object.entries(SYSTEM.abilities)) {
			data[key] = data.proficiency;
			if ( OPTIONS.abilities[key] ) data[key] = abl.value;
			else data[key] = data.proficiency;
			if ( abl.spellcasting ) {
				data.magic = Math.max(data.magic, abl.value);
			}
		}
		return data;
	}

	
	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */
	
	async _preCreate(data, options, user) {
		if ( user.id != game.user.id) return false;
		let attackItem = await fromUuid("Compendium.skyfall.items.Item.7LGIPMXkxWcjsg7E");
		attackItem = attackItem.toObject(true);
		attackItem.flags.skyfall ??= {}
		attackItem.flags.skyfall.attack = true;
		delete attackItem._id;
		delete attackItem._stats;
		delete attackItem.ownership;
		delete attackItem.folder;
		this.parent.updateSource({"items": [attackItem]})
	}

	
	/* -------------------------------------------- */
	/* System Methods                               */
	/* -------------------------------------------- */
	
	async _applyDamage(roll, multiplier = 1, applyDR = false) {
		console.groupCollapsed( 'applyDamage' );
		const damage = Math.min( roll.total, 1 ) * (multiplier == -1 ? -1 : 1);
		const hc = this.resources.hc;
		let updateHC = Math.clamp( hc.value - damage, 0, hc.max);
		// Update the Actor
		const updateData = {
			"system.resources.hc.value": updateHC,
		};
		console.groupEnd();
		await this.parent.update(updateData);
	}

	async _applyConsuption() {}
	async _rollInitiative() {
		return 0;
	}

}