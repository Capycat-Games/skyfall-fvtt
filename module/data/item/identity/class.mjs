import Identity from "./identity.mjs";

/**
 * Data schema, attributes, and methods specific to Class type Items.
 */
export default class Class extends Identity {
	
	/* -------------------------------------------- */
	/*  Type Options                                */
	/* -------------------------------------------- */

	#typeOptions() {
		return {
			...super._typeOptions,
			type: 'class',
			unique: false,
			parentTypes: ['character'],
			benefitTypes: {feature: [], grant: []},
			sheet: {
				parts: ["header","tabs","traits","benefits","feats","effects"],
				tabs: ["traits","benefits","feats","effects"],
				tabGroups: 'traits',
			}
		}
	}
	
	get _typeOptions () {
		return this.#typeOptions();
	}
	
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
			initial: new fields.BooleanField({required: true, initial:false, label: "Inicial"}),
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
		if ( 'level' in source && !(source.level instanceof Number)) {
			source.level = Number(source.level) || 1;
		}
	}
	
	/* -------------------------------------------- */
	/*  Schema Factory                              */
	/* -------------------------------------------- */
	

	/* -------------------------------------------- */
	/*  Getter & Setters                            */
	/* -------------------------------------------- */
	
	get _benefits () {
		const data = this.toObject(true)
		let benefits = {};
		for (let level = 1; level <= 12; level++) {
			benefits[level] = this._typeOptions.benefitTypes;
		}
		const content = data.benefits;
		content.reduce((acc, v, i) => {
			v._index = i;
			v.item = fromUuidSync(v.uuid);
			acc[v.level][v.type] ??= [];
			acc[v.level][v.type].push(v);
			return acc;
		}, benefits);
		return benefits;
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareBaseData() {
		this.hitDie.max = this.level;
	}

	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */

	async identityOrigin() {
		if ( !this.parent.isEmbedded ) return true;
		const {type, unique, parentTypes, benefitTypes} = this._typeOptions;
		const actor = this.parent.parent;
		const identifier = this.identifier;
		const existingItems = actor.items.filter( i => i.type == type );
		const existingIdentifier = existingItems.find( i => i.system.identifier == identifier );
		console.warn("Class._onCreate", {
			identifier, existingIdentifier, existingItems
		});
		if ( existingIdentifier ) {
			const nextLevel = existingIdentifier.system.level + 1;
			existingIdentifier.system.levelUp(nextLevel);
			return false;
		} 
		if ( existingItems.length && !existingIdentifier ) {
			const level = actor.system.level.value + 1;
			const lvl = String(level).padStart(2, 0);
			const origin = `class-${lvl}`;
			this.parent.updateSource({'system.origin': [origin]});
			return true;
		} else if ( !existingIdentifier ) {
			console.warn("Class._onCreate", 'initial', 'origin');
			this.parent.updateSource({
				'system.initial': true,
				'system.origin': ['class-01']
			});
			return true;
		}
		return true;
	}

	/* -------------------------------------------- */
	/*  Type Methods                                */
	/* -------------------------------------------- */

	async levelUp(originId) {
		if ( !this.parent.isEmbedded ) return;
		const item = this.parent;
		if ( !item.isOwned ) return;
		const actor = item.parent;
		const classes = actor.items.filter(i => i.type == 'class');
		const lvl = String(originId).padStart(2,0);
		const updateData = {items: []};
		let level = false;
		for (const cls of classes) {
			const origin = cls.system.origin;
			origin.findSplice( i => i == `class-${lvl}`);
			if ( cls.id == item.id ) {
				origin.push(`class-${lvl}`);
			}
			origin.sort();
			if ( cls.id == item.id ) {
				level = origin.indexOf(`class-${lvl}`) + 1;
			}
			console.warn('system.origin', origin);
			updateData.items.push({
				_id: cls.id,
				'system.origin': origin,
				'system.level': origin.filter(i => i.startsWith('class-')).length,
			})
		}
		await actor.update(updateData);
		if ( level && Object.values(item.system._benefits[level]).some(i => i.length) ) {
			const { BenefitsDialog } = skyfall.applications
			BenefitsDialog.prompt({item: item, level: level});
		}
	}
}