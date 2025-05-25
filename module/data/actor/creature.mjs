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
			// skills: new _fields.MappingField(new fields.SchemaField({
			// 	value: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0, max:2, label: "SKYFALL.DM.RANK"}),
			// 	bonus: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, label: "SKYFALL.DM.OTHER"}),
			// 	bonuses: new fields.ArrayField(new fields.StringField({})),
			// 	custom: new fields.BooleanField({initial: false}),
			// 	label: new fields.StringField({required: true}),
			// }), {
			// 	initialKeys: SYSTEM.skills, 
			// 	initialKeysOnly: false, label: "SKYFALL.DM.SKILLPL"
			// }),
			
			skills: new _fields.MappingField(
				new fields.EmbeddedDataField( _fields.SkillData ), {
					initialKeys: SYSTEM.skills, 
					initialKeysOnly: false, label: "SKYFALL.DM.SKILLPL"
				}
			),
			proficiency: new fields.NumberField({
				required: true,
				nullable: false,
				integer: true,
				initial: 2,
				label: "SKYFALL2.Proficiency"
			}),
			// proficiencies: new fields.ArrayField(
			// 	new fields.StringField({
			// 		choices: SYSTEM.proficiencies
			// 	}),
			// 	{label: "SKYFALL2.ProficiencyPl"}
			// ),
			proficiencies: new _fields.ArrayField(
				new fields.StringField({
					blank: false,
				}), {
					choices: skyfall.utils.keyPairObject(
						{...SYSTEM.weapons, ...SYSTEM.armors}, 'label'
					),
					initial: ['simple'],
					type: "checkboxes",
					custom: true,
					label: "SKYFALL2.ProficiencyPl",
				}
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
			initiative: new fields.EmbeddedDataField( _fields.InitiativeData, {
				label: "SKYFALL2.Initiative",
			}),
			modifiers: new fields.SchemaField({
				roll: new fields.SchemaField({
					attack: new fields.SchemaField({
						bonus: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
						mod: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
					}),
					damage: new fields.SchemaField({
						bonus: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
						mod: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
					}),
					ability: new fields.SchemaField({
						bonus: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
						mod: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
					}),
					skill: new fields.SchemaField({
						bonus: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
						mod: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
					}),
					deathsave: new fields.SchemaField({
						bonus: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
						mod: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
					}),
					initiative: new fields.SchemaField({
						bonus: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
						mod: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
					}),
					catharsis: new fields.SchemaField({
						bonus: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
						mod: new _fields.RollBonusField( new fields.SchemaField({
							value: new fields.StringField(),
							descriptors: new fields.StringField(),
						})),
					}),
				}),
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
					cost: new _fields.RollBonusField( new fields.SchemaField({
						value: new fields.StringField(),
						descriptors: new fields.StringField(),
					})),
					limit: new _fields.RollBonusField( new fields.SchemaField({
						value: new fields.StringField(),
						descriptors: new fields.StringField(),
					})),
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
				dr: new fields.SchemaField({
					bonus: new fields.ArrayField(new fields.StringField(),{}),
					armor: new fields.ArrayField(new fields.StringField(),{}),
					unarmored: new fields.ArrayField(new fields.StringField(),{}),
					shield: new fields.ArrayField(new fields.StringField(),{}),
				}),
				protections: new fields.SchemaField({
					all: new fields.ArrayField(new fields.StringField(),{}),
					mental: new fields.ArrayField(new fields.StringField(),{}),
					physical: new fields.ArrayField(new fields.StringField(),{}),
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
					choices: OPTIONS.abilities,
					initial: "str",
					label: "SKYFALL2.Ability"
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
			biography: new fields.HTMLField({required: true, blank: true}),
		}
	}

	static migrateData(source) {
		if ( foundry.utils.hasProperty(source, 'modifiers.damage.taken') ) {
			const irvLevels = {
				"vul": 'vulnerability',
				"nor": 'normal',
				"res": 'resistance',
				"imu": 'imunity'
			};
			for (const [key, value] of Object.entries(source.modifiers.damage.taken) ) {
				if ( Object.values(irvLevels).includes(value) ) continue;
				source.modifiers.damage.taken[key] = irvLevels[value] ?? 'normal'
			}
		}
		if ( foundry.utils.hasProperty(source, 'modifiers.damage.dealt') ) {
			const irvLevels = {
				"vul": 'vulnerability',
				"nor": 'normal',
				"res": 'resistance',
				"imu": 'imunity'
			};
			for (const [key, value] of Object.entries(source.modifiers.damage.dealt) ) {
				if ( Object.values(irvLevels).includes(value) ) continue;
				source.modifiers.damage.dealt[key] = irvLevels[value] ?? 'normal'
			}
		}
		if ( foundry.utils.hasProperty(source, 'modifiers.condition.imune') ) {
			source.modifiers.condition.imunity = source.modifiers.condition.imune;
		}
		return super.migrateData(source);
	}

	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */

	static schemaDamage() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		const dmgResLevels = Object.keys(SYSTEM.damageModifiers);
		const dmgTypes = Object.values(SYSTEM.DESCRIPTOR.DAMAGE);
		dmgTypes.unshift({id: 'all', label: 'all' });
		return new fields.SchemaField( dmgTypes.reduce((obj, dmg) => {
			obj[dmg.id] = new _fields.SelectField({
				choices: dmgResLevels,
				initial: "normal",
			});
			return obj;
		}, {}));
	}


	static schemaAbility() {
		const fields = foundry.data.fields;
		return new fields.SchemaField({
			value: new fields.NumberField({
				required: true,
				nullable: false,
				integer: true,
				initial: 0,
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
	/*  Getters & Setter                            */
	/* -------------------------------------------- */

	get directoryData() {
		return game.i18n.localize(`TYPES.Actor.${this.parent.type}`);
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
		this.initiative._prepareData();
	}

	prepareSkillBonuses(){
		const rollData = this.parent.getRollData();
		for (const [key, skill] of Object.entries(this.skills)) {
			skill.label = game.i18n.localize( SYSTEM.skills[key].label ?? "SKYFALL2.Skill" );
			const ranks = ["Unproficient", "Proficient", "Expert"];
			skill.rank = `SKYFALL2.PROFICIENCY.${ranks[skill.value]}`;
			const roll = skill.roll;
			roll.terms = roll.terms.filter( t => t.isDeterministic );
			roll.resetFormula();
			if ( roll.formula && roll.isDeterministic ) roll.evaluateSync();
			skill._roll = {};
			skill._roll['pro'] = roll.total;
			for (const [abl, ability] of Object.entries(this.abilities)) {
				skill._roll[abl] = roll.total + ability.value;
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
	/*  Database Operations                         */
	/* -------------------------------------------- */
	
	_onUpdate(changed, options, userId) {
		this._automateStatuses(userId);
	}
		
	async _automateStatuses(userId){
		if( game.userId != userId ) return;
		const hp = foundry.utils.getProperty(this, 'resources.hp');
		if ( hp ) {
			const hurt = this.parent.statuses.has('hurt');
			const { value, max } = hp;
			if ( (hurt ? (value * 2 > max) : (value * 2 < max)) ) {
				this.parent.toggleStatusEffect('hurt');
			}
		}
		const capacity = foundry.utils.getProperty(this, 'capacity');
		if ( capacity ) {
			const encumbered = this.parent.statuses.has('encumbered');
			const { value, max } = capacity;
			if ( (encumbered ? (value < max) : (value > max)) ) {
				this.parent.toggleStatusEffect('encumbered');
			}
		}
		const fragments = foundry.utils.getProperty(this, 'fragments');
		if ( fragments ) {
			const overload = this.parent.statuses.has('arcaneoverload');
			const { value, max } = fragments;
			if ( !overload && value > max ) {
				const overload = await this.parent.toggleStatusEffect('arcaneoverload');
				
				const roll = new Roll(`${value}d6[energy]`);
				await roll.evaluate();
				ChatMessage.create({
					rolls: [roll],
					system: {
						effects: [overload.toObject()]
					}
				});
				const changes = [
					{key: "system.modifiers.hp.totalExtra", mode: 2, value: roll.total * -1},
				]
				overload.update({"changes": changes});
				
			} else if ( overload && value < max ) {
				this.parent.toggleStatusEffect('arcaneoverload');
			}
		}
	}

	/* -------------------------------------------- */
	/* Type Methods                                 */
	/* -------------------------------------------- */
	
	async _applyDamage(roll, multiplier = 1, applyDR = false) {
		console.groupCollapsed( 'applyDamage' );

		// Apply changes to the ACTOR
		const { changes } = roll.options;
		if ( changes ) {
			const effect = new ActiveEffect({
				name: "Roll Modifiers", type: "base",
				disabled: false,
				changes: changes,
			});
			for (const change of changes) {
				effect.apply(this.parent, change);
			}
		}

		// Get current resource values
		const { hp, ep } = this.resources;
		applyDR = multiplier == -1 ? false : applyDR;
		const dr = this.dr;
		
		let drTypes = this.modifiers.damage.taken;
		const drMods = {normal: 1, imunity: 0, resistance: 0.5, vulnerability: 1.5 };
		drTypes = Object.entries(drTypes).reduce( (acc, dr ) => {
				acc[dr[0]] = drMods[dr[1]];
				return acc;
		}, {});
		
		let damage;
		let typeDamage = {};
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
		const specialTypes = ['temp-hp','temp-ep', 'ep'];
		const recovery = {
			ep: 0,
			tempHP: 0,
			tempEP: 0,
		}
		// Apply Damage Reduction for each type of damage
		for ( let [type, dmg] of Object.entries(typeDamage) ){
			overview.types[type] = dmg;
			if ( specialTypes.includes(type) ) {
				dmg = Math.floor(dmg * Number(multiplier) );
				if ( type == "ep" ) {
					recovery.ep += dmg;
				} else if ( type == "temp-hp" ) recovery.tempHP -= dmg;
				else if ( type == "temp-ep" ) recovery.tempEP -= dmg;
			} else {
				const typeMod = drTypes[type] ?? 1;
				dmg = Math.floor(dmg * Number(multiplier) * Number(typeMod) );
				damage += dmg;
			}
			
		}
		
		const deltaTemp = damage > 0 ? Math.min(hp.temp, damage) : 0;
		const deltaHP = Math.clamp(damage - deltaTemp, -hp.max, hp.max * 2);
		const deltaTempEP = recovery.ep > 0 ? Math.min(ep.temp, recovery.ep) : 0;
		const deltaEP = Math.clamp(recovery.ep - deltaTempEP, 0, ep.max);

		// Update the Actor
		const updateData = {
			"system.resources.hp.value": hp.value - deltaHP,
			"system.resources.hp.temp": Math.max(hp.temp - deltaTemp, recovery.tempHP),
			"system.resources.ep.value": ep.value - deltaEP,
			"system.resources.ep.temp": Math.max(ep.temp - deltaTempEP, recovery.tempEP),
		};
		console.groupEnd();

		await this.parent.update(updateData);
	}

	_prepareItems(){
		const items = {
			actions: [],
			abilities: [],
			spells: [],
			inventory: {},
			identity: {},
			sigils: [],
			features: [],
			class: [], //deprecate
			path: [], //deprecate
			progression: SYSTEM.characterProgression, //deprecate
		}
		const inventory = ['weapon','armor','equipment','clothing','loot','consumable'];
		const identity = ['legacy','heritage','curse','background','class','path','hierarchy','archetype'];
		const progression = ['legacy','curse','background'];  //deprecate
		const classPaths = ['class','path'];  //deprecate
		for (const item of this.parent.items ) {
			if ( inventory.includes(item.type) ) {
				if ( item.system.packCapacity ) {
					item.system.volume = Math.floor(item.system.capacity / item.system.packCapacity) * item.system.quantity;
				} else {
					item.system.volume = item.system.capacity * item.system.quantity;
				}
				items.inventory[item.type] ??= [];
				items.inventory[item.type].push(item);
				items.inventory.category ??= [];
				items.inventory.category.push(item);
			}
			if ( identity.includes(item.type) ) {
				items.identity[item.type] ??= [];
				items.identity[item.type].push(item);
			}
			if ( ['feature','feat'].includes(item.type) ) items.features.push(item);
			if ( item.type == 'ability' ) items.abilities.push(item);
			if ( item.type == 'spell' ) items.spells.push(item);
			if ( item.type == 'sigil' ) items.sigils.push(item);
			if ( progression.includes(item.type) ) items[item.type] = item;
			if ( classPaths.includes(item.type) ) items[item.type].push(item);
		}
		const spellLayer = {
			'cantrip': 0,
			'superficial': 1,
			'shallow': 2,
			'deep': 3,
		}
		items.spells.sort( (a, b) => {
			const layerA = spellLayer[a.system.spellLayer];
			const layerB = spellLayer[b.system.spellLayer];
			return layerA > layerB ? 1 : layerA < layerB ? -1 : 0;
		});
		let layer = '';
		for (const spell of items.spells) {
			if ( layer != spell.system.layerLabel ) {
				spell.layerLabel = spell.system.layerLabel;
			}
			layer = spell.system.layerLabel;
		}
		return items;
	}

	async _applyConsuption() {}
	async _rollInitiative() {}


	_getRollBonuses(type, descriptors) {
		const rollData = this.parent?.getRollData();
		const bonuses = this.modifiers.roll[type].bonus.filter( i => {
			if ( !i.descriptors ) return true;
			if ( !i.descriptors.split(' ').every( d => descriptors.includes(d) ) ) return false;
			return true;
		}).map( i => {
			const roll = new SkyfallRoll(i.value, rollData, {});
			return roll.terms.map( t => ({
				expression: t.expression, flavor: t.flavor, data: t.data, source: t.source
			}));
		});
		if ( !bonuses ) return false;
		
		// bonuses.unshift('1');
		return bonuses.flat();
		const roll = new SkyfallRoll(bonuses.join('+'), rollData);
		roll.terms.shift();
		return roll.terms;
	}
	
	_getRollModifiers(type, descriptors) {
		const rollData = this.parent?.getRollData();
		
		const modifiers = this.modifiers.roll[type].mod.filter( i => {
			if ( !i.descriptors ) return true;
			if ( !i.descriptors.split(' ').every( d => descriptors.includes(d) ) ) return false;
			return true;
		}).map( i => {
			const roll = new SkyfallRoll(`1d6${i.value}`, rollData, {});
			return roll.terms[0].modifiers;
		});

		return modifiers.flat( [...new Set(modifiers)]);
	}

}
