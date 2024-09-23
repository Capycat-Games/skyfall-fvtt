import Creature from "./creature.mjs";
/**
 * Data schema, attributes, and methods specific to Character type Actors.
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
	
	async _rollInitiative({initiativeOptions={}}) {
		const roll = await new RollConfig({
			type: 'initiative',
			ability: 'dex',
			// skill: null,
			actor: this,
			createMessage: true,
			skipConfig: initiativeOptions.skipConfig ?? false,
			advantageConfig: initiativeOptions.advantageConfig ?? 0,
		}).render( !(initiativeOptions.skipConfig ?? false) );
	}

}