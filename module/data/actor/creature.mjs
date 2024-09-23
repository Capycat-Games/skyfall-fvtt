/**
 * Data schema, attributes, and methods shared by Creature type Actors.
 */

export default class Creature extends foundry.abstract.TypeDataModel {

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	static get OPTIONS() {
		return {
			abilities: {
				str: SYSTEM.abilities.str,
				dex: SYSTEM.abilities.dex,
				con: SYSTEM.abilities.con,
				int: SYSTEM.abilities.int,
				wis: SYSTEM.abilities.wis,
				cha: SYSTEM.abilities.cha,
			}
		}
	}

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		const OPTIONS = this.OPTIONS;

		return {
			abilities: new _fields.MappingField( this.schemaAbility() , {
				initialKeys: OPTIONS.abilities,
				initialKeysOnly: true, label: "SKYFALL2.AbilityPl"
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
			proficiency: new fields.NumberField({
				required: true,
				nullable: false,
				integer: true,
				initial: 2,
				label: "SKYFALL2.Proficiency"
			}),
			proficiencies: new fields.ArrayField(
				new fields.StringField({
					choices: SYSTEM.proficiencies
				}),
				{label: "SKYFALL2.ProficiencyPl"}
			),
			languages: new fields.ArrayField(
				new fields.StringField({
					choices: SYSTEM.languages
				}),
				{label: "SKYFALL2.LanguagePl"}
			),
			dr: new fields.NumberField({
				required: true,
				nullable: false,
				integer: true,
				initial: 0,
				min: 0,
				label: "SKYFALL2.DamageReductionAbbr"
			}),
			modifiers: new fields.SchemaField({
				damage: new fields.SchemaField({
					taken: this.schemaDamage(),
					dealt: this.schemaDamage(),
				}),
				condition: new fields.SchemaField({
					imune: new fields.SetField(
						new fields.StringField({
							required:true,
							choices: SYSTEM.conditions
						}),
						{label:"SKYFALL2.MODIFIER.Conditions"}
					),
					//new fields.SetField(new fields.StringField({required: true, blank:false, choices: SYSTEM.conditions}), {label: "SKYFALL2.MODIFIER.Conditions"}),
					protected: new fields.SetField(
						new fields.StringField({
							choices: SYSTEM.conditions
						})
					),
				}),
				descriptor: new fields.SchemaField({
					imune: new fields.ArrayField(
						new fields.StringField({
							choices: SYSTEM.DESCRIPTORS
						})
					),
					protected: new fields.ArrayField(
						new fields.StringField({
							choices: SYSTEM.STATUSEFFECTS
						})
					),
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
					abilities: new fields.ArrayField(
						new fields.StringField({}),
						{
							initial:['con'],
							label:"SKYFALL2.AbilityPl"
						}
					),
					levelRoll: new fields.ArrayField(
						new fields.NumberField({}),
						{
							min:12,
							max:12,
							initial: Array.fromRange(12, 1).fill(0),
							label:"SKYFALL2.RESOURCE.LevelRoll"
						}
					),
					levelExtra: new fields.ArrayField(
						new fields.StringField({}),
						{
							label:"SKYFALL2.RESOURCE.LevelBonus"
						}
					),
					totalExtra: new fields.ArrayField(
						new fields.StringField({}),
						{
							label:"SKYFALL2.RESOURCE.TotalBonus"
						}
					),
				}),
				ep: new fields.SchemaField({
					abilities: new fields.ArrayField(
						new fields.StringField({}),
						{
							initial: ['con'],
							label: "SKYFALL2.AbilityPl"
						}
					),
					levelExtra: new fields.ArrayField(
						new fields.StringField({}),
						{
							label:"SKYFALL2.RESOURCE.LevelBonus"
						}
					),
					totalExtra: new fields.ArrayField(
						new fields.StringField({}),
						{
							label:"SKYFALL2.RESOURCE.TotalBonus"
						}
					),
				}),
			}),
			level: new fields.SchemaField({
				value: new fields.NumberField({
					required: true,
					nullable: false,
					integer: true,
					initial: 1,
					min: 1,
					label: "SKYFALL2.Level"
				}),
				xp: new fields.NumberField({
					required: true,
					nullable: false,
					integer: true,
					initial: 1,
					min: 0,
					label: "SKYFALL2.Experience"
				}),
			}),
			movement: new fields.SchemaField({
				walk: new fields.NumberField({
					required: true,
					nullable: false,
					initial: 9,
					min: 0,
					label: "SKYFALL.DM.MOVEMENT.WALK"
				}),
				swim: new fields.NumberField({
					required: true,
					nullable: false,
					initial: 0,
					min: 0,
					label: "SKYFALL.DM.MOVEMENT.SWIM"
				}),
				burrow: new fields.NumberField({
					required: true,
					nullable: false,
					initial: 0,
					min: 0,
					label: "SKYFALL.DM.MOVEMENT.BURROW"
				}),
				flight: new fields.NumberField({
					required: true,
					nullable: false,
					initial: 0,
					min: 0,
					label: "SKYFALL.DM.MOVEMENT.FLIGHT"
				}),
				str: new fields.NumberField({
					required: true,
					nullable: false,
					initial: 0,
					min: 0,
					label: "SKYFALL.DM.MOVEMENT.STR"
				}),
				dex: new fields.NumberField({
					required: true,
					nullable: false,
					initial: 0,
					min: 0,
					label: "SKYFALL.DM.MOVEMENT.DEX"
				}),
			}),
			size: new fields.StringField({
				choices: SYSTEM.actorSizes,
				initial:"med",
				label: "SKYFALL2.Size"
			}),
			currency: new fields.SchemaField({
				t: new fields.NumberField({
					required: true,
					nullable: false,
					integer: true,
					initial: 0,
					min: 0,
					label: "SKYFALL2.CURRENCY.T"
				}),
				p: new fields.NumberField({
					required: true,
					nullable: false,
					integer: true,
					initial: 0,
					min: 0,
					label: "SKYFALL2.CURRENCY.P"
				}),
				k: new fields.NumberField({
					required: true,
					nullable: false,
					integer: true,
					initial: 0,
					min: 0,
					label: "SKYFALL2.CURRENCY.K"
				}),
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
			}),
			spellcasting: new fields.StringField({
				choices: OPTIONS.abilities,
				initial:"int",
				label: "SKYFALL2.ABILITY.Spellcasting"
			}),
			creatureType: new fields.StringField({
				choices: SYSTEM.creatureTypes,
				blank:true,
				initial: "humanoid",
				label: "SKYFALL2.Type"
			}),
			roll: new fields.SchemaField({
				modifiers: new _fields.RollModifiersField(
					this.schemaRollModifier(),
				)
			}),
		}
	}

	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */

	static schemaDamage() {
		const fields = foundry.data.fields;
		const dmgResLevels = Object.keys(SYSTEM.damageModifiers);
		const dmgTypes = Object.values(SYSTEM.DESCRIPTOR.DAMAGE);
		return new fields.SchemaField( dmgTypes.reduce((obj, dmg) => {
			obj[dmg.id] = new fields.StringField({choices: dmgResLevels, initial: "nor"});
			return obj;
		}, {}));
	}

	static schemaAbility() {
		const fields = foundry.data.fields;
		return new fields.SchemaField({
			value: new fields.NumberField({
				required: true, nullable: false, integer: true,
				initial: 0, min: -3, max: 5
			}),
			protection: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0}),
			proficient: new fields.BooleanField({initial: false}),
			initiative:  new fields.BooleanField({initial: false}),
		});
	}

	static schemaRollModifier(){
		const fields = foundry.data.fields;
		return new fields.SchemaField({
			type: new fields.ArrayField(
				new fields.StringField({
					choices: [
						{
							value: "check",
							label: "check"
						},
						{
							value: "ability",
							label: "ability"
						},
						{
							value: "initiative",
							label: "initiative"
						},
						{
							value: "skill",
							label: "skill"
						},
						{
							value: "attack",
							label: "attack"
						},
						{
							value: "damage",
							label: "damage"
						},
						{
							value: "deathsave",
							label: "deathsave"
						},
						{
							value: "catharsis",
							label: "catharsis"
						},
						{
							value: "rest",
							label: "rest"
						},
					],
				}),
			),
			options: new fields.ArrayField(
				new fields.StringField({
					choices: [
						{value:"unique", label: "unique"},
						{value:"choices", label: "choices"},
						{value:"range", label: "range"},
					],
				}),
			),
			method: new fields.StringField({
				required: true,
				initial: 'add',
				label: "METODO",
				choices: [
					{
						value: "add",
						label: "add",
					},
					{
						value: "multiply",
						label: "multiply",
					},
					{
						value: "upgrade",
						label: "upgrade",
					},
					{
						value: "downgrade",
						label: "downgrade",
					},
					{
						value: "override",
						label: "override",
					},
					{
						value: "damage-type",
						label: "damage-type",
					},
					{
						value: "die-number",
						label: "die-number",
					},
					{
						value: "die-faces",
						label: "die-faces",
					},
					{
						value: "per-die",
						label: "per-die",
					},
					{
						value: "modifier",
						label: "modifier",
					},
					{
						value: "minimum",
						label: "minimum",
					},
					{
						value: "maximum",
						label: "maximum",
					},
					{
						value: "advantage",
						label: "advantage",
					},
					{
						value: "advantage-extra",
						label: "advantage-extra",
					},
					{
						value: "disadvantage",
						label: "disadvantage",
					},
					{
						value: "disadvantage-extra",
						label: "disadvantage-extra",
					},
				]
			}),
			value: new fields.StringField({
				required: true,
				blank: true,
				label: "VALOR"
			}),
			choices: new fields.ArrayField(
				new fields.SchemaField({
					value: new fields.StringField({
						required: true,
						blank: true,
					}),
					label: new fields.StringField({
						required: true,
						blank: true,
					}),
				}),
			),
			source: new fields.StringField({
				required: true,
				blank: true,
				label: "FONTE"
			}),
			conditional: new fields.SchemaField({
				source: new fields.StringField({
					required: true,
					blank: true,
					label: "FONTE"
				}),
				flavor: new fields.StringField({
					required: true,
					blank: true,
					label: "DANO"
				}),
				descriptor: new fields.StringField({
					required: true,
					blank: true,
					label: "DESCRITOR"
				}),
				target: new fields.StringField({
					required: true,
					blank: true,
					label: "ALVO"
				}),
			})
		});
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareBaseData() {
		// ABILITIES
		for (const [key, abl] of Object.entries(this.abilities)) {
			abl.label = SYSTEM.abilities[key].abbr;
			abl.protection = 10 + abl.value + (abl.proficient ? this.proficiency : 0);
		}
	}

	/** @inheritDoc */
	prepareDerivedData() {
		this.prepareSkillBonuses();
	}

	prepareSkillBonuses(){
		const rollData = this.parent.getRollData();
		for (const [key, skill] of Object.entries(this.skills)) {
			const r = new Roll( skill.bonuses.join('+'), rollData );
			r.terms = r.terms.filter( t => t.isDeterministic );
			r.resetFormula();
			if ( r.formula && r.isDeterministic ) r.evaluateSync();
			const bonuses = Number(r.total);
			
			skill.roll = {};
			skill.roll['pro'] = this.proficiency * skill.value + bonuses;
			for (const [abl, ability] of Object.entries(this.abilities)) {
				skill.roll[abl] = (this.proficiency * skill.value) + ability.value + bonuses;
			}
		}
	}

	getRollData() {
		const data = { ...this };
		data.magic = 0;
		for (const [key, abl] of Object.entries(data.abilities)) {
			data[key] = abl.value;
			if ( abl.spellcasting ) {
				data.magic = Math.max(data.magic, abl.value);
			}
		}
		data['prof'] = data['proficiency'];
		for (const [key, skill] of Object.entries(data.skills)) {
			data[key] = data['prof'] * skill.value;
		}
		return data;
	}

	/* -------------------------------------------- */
	/* System Methods                               */
	/* -------------------------------------------- */
	
	async _applyDamage(roll, multiplier = 1, applyDR = false) {
		console.groupCollapsed( 'applyDamage' );
		// Get current resource values
		const { hp, ep } = this.resources;
		applyDR = multiplier == -1 ? false : applyDR;
		const dr = this.dr;
		
		let drTypes = this.modifiers.damage.taken;
		const drMods = {nor:1, imu:0, res:0.5, vul:1.5 };
		drTypes = Object.entries(drTypes).reduce( (acc, dr ) => {
				acc[dr[0]] = drMods[dr[1]];
				return acc;
		}, {});

		let damage, typeDamage;
		
		if( roll ){
			let defaultDamage = 'slashing';
			typeDamage = roll.terms.reduce( (acc, t, idx) =>{
				if ( idx == 0 && t.options.flavor ) defaultDamage = t.options.flavor;
				let dType = t.options.flavor ?? defaultDamage;
				if ( !acc[dType] ) acc[dType] = 0;
				if( Number(t.total) ) {
					acc[dType] += t.total;
				}
				return acc;
			}, {});
		}
		
		if ( applyDR ) damage = 0 - dr;
		else damage = 0;
		// Apply Damage Reduction for each type of damage
		for ( let [type, dmg] of Object.entries(typeDamage) ){
			const typeMod = drTypes[type] ?? 1;
			dmg = Math.floor(dmg * Number(multiplier) * Number(typeMod) );
			damage += dmg;
		}
		// Deduct value from temp resource first
		let updHPT = hp.temp;
		if ( damage > 0 ) {
			updHPT = Math.max( (updHPT - damage), 0 );
			if ( damage >= hp.temp  ) damage = damage - hp.temp;
		}
		// Remaining goes to resource
		let updHPV = hp.value;
		updHPV = Math.clamp( (updHPV - damage), (hp.max*-1), hp.max );
		
		// Update the Actor
		const updateData = {
			"system.resources.hp.temp": updHPT,
			"system.resources.hp.value": updHPV,
		};

		await this.parent.update(updateData);
		
		console.groupEnd();
	}


	async _applyConsuption() {}
	async _rollInitiative() {}

}
