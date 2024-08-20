import Creature from "./creature.mjs";
/**
 * Data schema, attributes, and methods specific to Personagem type Items.
 */

export default class Character extends Creature {
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */
	
	
	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		const OPTIONS = this.OPTIONS;
		
		return Object.assign( super.defineSchema(), {
			resources: new fields.SchemaField({
				hp: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, label: "SKYFALL2.Current"}),
					max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1, label: "SKYFALL2.Total"}),
					temp: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL2.Temporary"}),
				}),
				ep: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, label: "SKYFALL2.Current"}),
					max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1, label: "SKYFALL2.Total"}),
					temp: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL2.Temporary"}),
				}),
				catharsis: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, max: 5, label: "SKYFALL2.RESOURCE.Catharsis"}),
				}),
				shadow: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 5, min: 0, max: 5, label: "SKYFALL2.RESOURCE.Shadow"}),
				}),
			}),
			death: new fields.SchemaField({
				success: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0,  max: 3, label: "SKYFALL.DM.SUCCESS"}),
				failure: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0,  max: 3, label: "SKYFALL.DM.FAILURE"}),
			}),
			fragments: new fields.SchemaField({
				abl: new fields.StringField({choices: OPTIONS.abilities, initial:"cha", label: "SKYFALL2.Ability"}),
				value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL.DM.CURRENT"}),
				max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1, label: "SKYFALL.DM.MAX"}),
			}),
			details: new fields.SchemaField({
				description: new fields.HTMLField(),
				pronouns: new fields.StringField({label: "SKYFALL2.Pronouns"}),
			}),
		})
		return {
			abilities: new _fields.MappingField(new fields.SchemaField({
				value: new fields.NumberField({
					required: true, nullable: false, integer: true,
					initial: 0, min: -3, max: 5
				}),
				protection: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0}),
				proficient: new fields.BooleanField({initial: false}),
				initiative:  new fields.BooleanField({initial: false}),
			}), {
				initialKeys: OPTIONS.abilities,
				initialKeysOnly: true, label: "SKYFALL.Abilities"
			}),
			attributes: new fields.SchemaField({
				// HP, DEATH, init, movement, attunement, senses, spellcasting, exhaustion
			}),
			resources: new fields.SchemaField({
				hp: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, label: "SKYFALL.DM.CURRENT"}),
					max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1, label: "SKYFALL.DM.TOTAL"}),
					temp: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL.DM.TEMPORARYABBR"}),
				}),
				ep: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, label: "SKYFALL.DM.CURRENT"}),
					max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1, label: "SKYFALL.DM.TOTAL"}),
					temp: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL.DM.TEMPORARYABBR"}),
				}),
				catharsis: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, max: 5, label: "SKYFALL.DM.CATHARSISPOINTS"}),
				}),
				shadow: new fields.SchemaField({
					value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 5, min: 0, max: 5, label: "SKYFALL.DM.SHADOWPOINTS"}),
				}),
			}),
			
			skills: new _fields.MappingField(new fields.SchemaField({
				value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, max:2, label: "SKYFALL.DM.RANK"}),
				other: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, label: "SKYFALL.DM.OTHER"}),
				bonuses: new fields.ArrayField(new fields.StringField({})),
				custom: new fields.BooleanField({initial: false}),
				label: new fields.StringField({required: true}),
			}), {
				initialKeys: SYSTEM.skills, 
				initialKeysOnly: false, label: "SKYFALL.DM.SKILLPL"
			}),
			proficiency: new fields.NumberField({required: true, nullable: false, integer: true, initial: 2, label: "SKYFALL.DM.PROFICIENCY"}),
			proficiencies: new fields.ArrayField(new fields.StringField({choices: SYSTEM.proficiencies}), {label: "SKYFALL.DM.PROFICIENCIES"}),
			languages: new fields.ArrayField(new fields.StringField({choices: SYSTEM.languages}), {label: "SKYFALL.DM.LANGUAGES"}),
			dr: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL.DM.DR"}),
			modifiers: new fields.SchemaField({
				damage: new fields.SchemaField({
					taken: this.#schemaDamage(),
					dealt: this.#schemaDamage(),
				}),
				roll: new fields.SchemaField({
					all: new fields.ArrayField(new fields.StringField()),
					ability: new fields.ArrayField(new fields.StringField()),
					skill: new fields.ArrayField(new fields.StringField()),
					attack: new fields.ArrayField(new fields.StringField()),
					death: new fields.ArrayField(new fields.StringField()),
					initiative: new fields.ArrayField(new fields.StringField()),
				}),
				condition: new fields.SchemaField({
					imune: new fields.SetField(new fields.StringField({required:true, choices: SYSTEM.conditions}),{label:"SKYFALL2.MODIFIER.Conditions"}),
					protected: new fields.ArrayField(new fields.StringField({choices: SYSTEM.STATUSEFFECTS})),
				}),
				descriptor: new fields.SchemaField({
					imune: new fields.ArrayField(new fields.StringField({choices: SYSTEM.DESCRIPTORS})),
					protected: new fields.ArrayField(new fields.StringField({choices: SYSTEM.STATUSEFFECTS})),
				}),
				rest: new fields.SchemaField({
					hitDieBonus: new fields.ArrayField(new fields.StringField({})),
					hitDieMod: new fields.ArrayField(new fields.StringField({})),
					bonusHP: new fields.ArrayField(new fields.StringField({})),
					bonusHPtemp: new fields.ArrayField(new fields.StringField({})),
					bonusEP: new fields.ArrayField(new fields.StringField({})),
					bonusEPtemp: new fields.ArrayField(new fields.StringField({})),
					bonusCatharsis: new fields.ArrayField(new fields.StringField({})),
				}),
				hp: new fields.SchemaField({
					abilities: new fields.ArrayField(new fields.StringField({})),
					levelExtra: new fields.ArrayField(new fields.StringField({})),
					totalExtra: new fields.ArrayField(new fields.StringField({})),
				}),
				ep: new fields.SchemaField({
					abilities: new fields.ArrayField(new fields.StringField({})),
					levelExtra: new fields.ArrayField(new fields.StringField({})),
					totalExtra: new fields.ArrayField(new fields.StringField({})),
				}),
			}),
			level:  new fields.SchemaField({
				value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1,  max: 12, label: "SKYFALL.DM.LEVEL"}),
				xp: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 0, label: "SKYFALL.DM.EXPERIENCY"}),
			}),
			movement: new fields.SchemaField({
				walk: new fields.NumberField({required: true, nullable: false, initial: 9, min: 0, label: "SKYFALL.DM.MOVEMENT.WALK"}),
				swim: new fields.NumberField({required: true, nullable: false, initial: 0, min: 0, label: "SKYFALL.DM.MOVEMENT.SWIM"}),
				burrow: new fields.NumberField({required: true, nullable: false, initial: 0, min: 0, label: "SKYFALL.DM.MOVEMENT.BURROW"}),
				flight: new fields.NumberField({required: true, nullable: false, initial: 0, min: 0, label: "SKYFALL.DM.MOVEMENT.FLIGHT"}),
				str: new fields.NumberField({required: true, nullable: false, initial: 0, min: 0, label: "SKYFALL.DM.MOVEMENT.STR"}),
				dex: new fields.NumberField({required: true, nullable: false, initial: 0, min: 0, label: "SKYFALL.DM.MOVEMENT.DEX"}),
			}),
			size: new fields.StringField({choices: SYSTEM.actorSizes, initial:"med", label: "SKYFALL.DM.SIZE"}),
			currency: new fields.SchemaField({
				t: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL2.CURRENCY.TAbbr"}),
				p: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL2.CURRENCY.PAbbr"}),
				k: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL2.CURRENCY.KAbbr"}),
			}),
			capacity: new fields.SchemaField({
				value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL.DM.CURRENT"}),
				max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1, label: "SKYFALL.DM.MAX"}),
			}, {label: "SKYFALL2.Capacity" }),
			fragments: new fields.SchemaField({
				abl: new fields.StringField({choices: OPTIONS.abilities, initial:"cha", label: "SKYFALL.DM.ABILITY"}),
				value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, label: "SKYFALL.DM.CURRENT"}),
				max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 1, label: "SKYFALL.DM.MAX"}),
			}),
			creatureType: new fields.StringField({choices: SYSTEM.creatureType, label: "SKYFALL.DM.CREATURETYPE"}),
			details: new fields.SchemaField({
				pronouns: new fields.StringField({label: "SKYFALL.DM.PRONOUNS"}),
			}),
			spellcasting: new fields.StringField({choices: OPTIONS.abilities, initial:"int", label: "SKYFALL2.ABILITY.Spellcasting"}),
		}
	}

	
	static migrateData(source) {
		return super.migrateData(source);
	}

	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */

	static #schemaDamage() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		const dmgResLevels = Object.keys(SYSTEM.damageModifiers);
		const dmgTypes = Object.values(SYSTEM.DESCRIPTOR.DAMAGE);
		return new fields.SchemaField( dmgTypes.reduce((obj, dmg) => {
			obj[dmg.id] = new fields.StringField({choices: dmgResLevels, initial: "nor"});
			return obj;
		}, {}));
	}

	/* -------------------------------------------- */
	/*  Getters & Setters                           */
	/* -------------------------------------------- */
	
	get classes() {
		return this.parent.items.filter(it => it.type == 'class');
	}

	get paths() {
		return this.parent.items.filter(it => it.type == 'path');
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */
	
	/** @inheritDoc */
	prepareBaseData() {
		this.level.value = this.classes.reduce( (acc, i) => acc + i.system.level, 0 );
		this.proficiency = (this.level.value >= 9 ? 4 : (this.level.value >= 5 ? 3 : 2));

		super.prepareBaseData();

		this.abilities[this.spellcasting].spellcasting = true;
	}

	/** @inheritDoc */
	prepareDerivedData() {
		super.prepareDerivedData();
		
		this.prepareHitPoints();
		this.prepareEmphasysPoints();

		this.prepareDamageReduction();
		this.prepareCapacity();
		this.prepareFragmentsLimit();
		
	}
	
	prepareHitPoints(){
		let hpPerLevelMethod = game.settings.get('skyfall', 'hpPerLevelMethod');
		if( hpPerLevelMethod == 'user' ) {
			hpPerLevelMethod = this.parent.getFlag('skyfall','hpPerLevelMethod');
		}
		if( hpPerLevelMethod == 'mean' ) this.prepareMaxHPMean();
		else if( hpPerLevelMethod == 'roll' ) this.prepareMaxHPRoll();
		const { hp } = this.resources;
		this.resources.hp.pct = Math.round( hp.value * 100 / hp.max );
		this.resources.hp.tpct = Math.round( hp.temp * 100 / hp.max );
		this.resources.hp.negative = hp.value < 0 ;
	}

	
	prepareMaxHPMean(){
		const hpConfig = this.modifiers.hp;
		const rollData = this.parent.getRollData();
		const hpData = { abl: 0, dieMean: 0 };
		
		for (const cls of this.classes) {
			const die = new Roll( cls.system.hitDie.die ).terms[0].faces;
			const mean = (((Number(die)) / 2) + 1);
			
			if ( cls.system.initial ) hpData.dieMax = Number(die);
			hpData.dieMean += mean * (cls.system.level - (cls.system.initial ? 1 : 0));
		}
		
		// Level -1 - first level is maxed
		hpData.level = (this.level.value ?? 1) - 1;
		// Sum of ability
		if ( hpConfig.abilities.length == 0 ) hpConfig.abilities = ['con'];
		hpData.abl = hpConfig.abilities.reduce((acc, abl) => acc + rollData[abl], 0);
		// Sum of bonus per level
		hpData.levelExtra = hpConfig.levelExtra.reduce((acc, bns) => {
			return acc + Number(rollData[bns] || bns || 0);
		}, 0);
		// Sum of bonus health
		hpData.totalExtra = hpConfig.totalExtra.reduce((acc, bns) => {
			return acc + Number(rollData[bns] || bns || 0);
		}, 0);

		// Pseudo Roll to calculate total hp
		const roll = new SkyfallRoll(`@dieMax + @dieMean + @abl + @levelExtra + ((@abl + @levelExtra) * @level) + @totalExtra`, hpData);
		roll.evaluateSync();
		
		// Set max HIT POINTS
		this.resources.hp.max = roll.total;
	}

	prepareMaxHPRoll(){
		const hpConfig = this.modifiers.hp;
		const rollData = this.parent.getRollData();
		const hpData = { abl: 0, levelExtra: 0, initial: 0 };
		const level = this.level.value;
		const cls = this.classes.find( i => i.system.initial );
		if ( cls ) {
			const die = new Roll( cls.system.hitDie.die ).terms[0].faces;
			hpConfig.levelRoll[0] = Number( die );
		}

		// Sum of ability
		if ( hpConfig.abilities.length == 0 ) hpConfig.abilities = ['con'];
		hpData.abl = hpConfig.abilities.reduce((acc, abl) => acc + rollData[abl], 0);
		// Sum of bonus per level
		hpData.levelExtra = hpConfig.levelExtra.reduce((acc, bns) => {
			return acc + Number(rollData[bns] || bns || 0);
		}, 0);
		// Sum of bonus health
		hpData.totalExtra = hpConfig.totalExtra.reduce((acc, bns) => {
			return acc + Number(rollData[bns] || bns || 0);
		}, 0);
		
		// Sum of rolled levels
		let total = hpConfig.levelRoll.reduce( (acc, value, i) => {
			if ( i >= level ) return acc;
			acc += value + hpData.abl + hpData.levelExtra;
			return acc;
		}, 0 );
		total += hpData.totalExtra;
		
		this.resources.hp.max = total;
	}

	prepareEmphasysPoints(){
		const { ep } = this.resources;
		const rollData = this.parent.getRollData();
		const epConfig = this.modifiers.ep;
		const epData = {level:0, total:0};
		const level = this.level.value;

		// Sum of bonus per level
		epData.level = epConfig.levelExtra.reduce((acc, bns) => {
			return acc + Number(rollData[bns] || bns || 0);
		}, 0);
		// Sum of bonus resource
		epData.total = epConfig.totalExtra.reduce((acc, bns) => {
			return acc + Number(rollData[bns] || bns || 0);
		}, 0);
		this.resources.ep.max = (level * 3) + ( level * epData.level ) + ( epData.total );
		this.resources.ep.pct = Math.round( ep.value * 100 / ep.max );
		this.resources.ep.tpct = Math.round( ep.temp * 100 / ep.max );
	}

	prepareDamageReduction(){
		const items = this.parent.items.filter( i => 'dr' in i.system && i.system.equipped );
		this.dr += items.reduce((acc, i) => acc += i.system.dr, 0);
	}

	prepareCapacity() {
		const str = this.abilities.str.value;
		this.capacity.max = 16 + ( str * ( str > 0 ? 3 : 2 ));
		const items = this.parent.items.filter( i => 'capacity' in i.system )
		this.capacity.value = items.reduce((acc, i) => acc += i.system.capacity, 0);
	}

	prepareFragmentsLimit() {
		const ability = this.abilities[this.fragments.abl]?.value ?? 0;
		this.fragments.max = ability + (this.proficiency * 2);
		// TODO CHECK IF ITEM IS EQUIPPED && ATTUNED
		const gear = this.parent.items.filter( i => i.system.equipped && i.system.attuned );
		let uuids = gear.map( i => i.system.sigils );
		uuids = uuids.reduce( (acc, i) => acc.concat(i), [] );
		//.filter( i => i.type=='sigil' && i.system.infused);
		// this.fragments.value = items.reduce((acc, i) => acc += i.system.fragments.amount, 0);
	}

	getRollData() {
		const data = super.getRollData();
		return data;
	}

	
  /* -------------------------------------------- */
  /*  Database Operations                         */
  /* -------------------------------------------- */

	
	/* -------------------------------------------- */
	/* System Methods                               */
	/* -------------------------------------------- */
	
	
	async _applyConsumption() {}
	async _rollInitiative() {}

}