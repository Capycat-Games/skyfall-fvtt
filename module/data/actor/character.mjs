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

	get directoryData() {
		const level = game.i18n.localize('SKYFALL2.Level') + ' ' + this.level.value;
		const classes = this.parent.items?.filter( i => i.type == 'class').reduce((acc, i)=> {
			acc.push(`${i.name} ${i.system.level}`);
			return acc;
		}, []).join(', ') ?? '—';
		const paths = this.parent.items?.filter( i => i.type == 'path').reduce((acc, i)=> {
			if(!acc.includes(i.name)) {
				acc.push(`${i.name}`);
			}
			return acc;
		}, []).join(', ') ?? '—';
		return `${level} - ${classes} - ${paths}`;
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
		
		this.prepareProtections();
		this.prepareHitPoints();
		this.prepareEmphasysPoints();
		this.prepareNextLevelXP();
		this.prepareDamageReduction();
		this.prepareCapacity();
		this.prepareFragmentsLimit();
		
	}
	
	prepareProtections() {
		try {
			for (const [key, ability] of Object.entries(this.abilities)) {
				const rollData = this.getRollData();
				const protectionMod = this.modifiers.protections;
				const type = ['str','dex','con', 'physical'].includes(key) ? 'physical' : 'mental';
				let roll = new SkyfallRoll([
					...protectionMod.all, protectionMod[type]
				].join('+'), rollData);
				ability.protection += roll.terms.length && roll.isDeterministic ? roll.evaluateSync().total : 0;
			}
		} catch (error) {
			
		}
	}

	prepareHitPoints(){
		let hpPerLevelMethod = game.settings.get('skyfall', 'hpPerLevelMethod');
		if( hpPerLevelMethod == 'user' ) {
			hpPerLevelMethod = this.parent.getFlag('skyfall','hpPerLevelMethod') ?? 'mean';
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
		const rollData = this.getRollData();
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
		console.log(roll);
		roll.evaluateSync();
		
		// Set max HIT POINTS
		this.resources.hp.max = roll.total;
	}

	prepareMaxHPRoll(){
		const hpConfig = this.modifiers.hp;
		const rollData = this.getRollData();
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

	prepareNextLevelXP(){
		const level = this.level.value;
		const xp = this.level.xp;
		const xpTable = [];
		xpTable[0] = 0;
		xpTable[1] = 0;
		xpTable[2] = 300;
		xpTable[3] = 900;
		xpTable[4] = 2700;
		xpTable[5] = 6500;
		xpTable[6] = 14000;
		xpTable[7] = 23000;
		xpTable[8] = 34000;
		xpTable[9] = 48000;
		xpTable[10] = 64000;
		xpTable[11] = 85000;
		xpTable[12] = 100000;
		xpTable[13] = 100000;
		const obj = {next: 0, pct: 0, hexbar: 0};
		obj.next = xpTable[level + 1];
		obj.pct = Math.round(( xp * 100 ) / obj.next);
		obj.hexbar = Math.round(((100 - obj.pct) / 100) * 2160);
		foundry.utils.mergeObject( this.level, obj );
	}

	prepareDamageReduction(){
		const rollData = this.parent.getRollData();
		const modifiers = Object.entries(this.modifiers.dr).reduce((acc, v) => {
			let key = v[0];
			let arr = v[1];
			if ( arr.length == 0 ) {
				acc[key] = 0;
				return acc;
			}
			const roll = new Roll(arr.join(' + '), rollData);
			if ( roll.isDeterministic ) {
				roll.evaluateSync();
				acc[key] = Number(roll.total) ? roll.total : 0;
			} else {
				acc[key] = 0;
			}
			return acc;
		}, {});
		const items = this.parent.items.filter( i => 'dr' in i.system && i.system.equipped );

		let unarmored = true;
		this.dr += items.reduce((acc, i) => {
			acc += i.system.dr
			if ( i.system.type == 'shield' ) acc += modifiers.shield;
			else if ( i.system.type ) {
				acc += modifiers.armor;
				unarmored = false;
			}

			return acc;
		}, 0);
		this.dr += modifiers.bonus;
		if ( unarmored ) this.dr += modifiers.unarmored;
	}

	prepareCapacity() {
		const ability = this.capacity.ability;
		const abl = this.abilities[ability].value;
		let bonus = this.capacity.bonus;
		let tmp = new Roll(bonus.join(' + '), this.getRollData());
		bonus = (tmp.terms.length && tmp.isDeterministic ? tmp.evaluateSync().total : 0);
		
		let bonusTotal = this.capacity.bonusTotal;
		tmp = new Roll(bonusTotal.join(' + '), this.getRollData());
		bonusTotal = (tmp.terms.length && tmp.isDeterministic ? tmp.evaluateSync().total : 0);
		
		this.capacity.max = (16 + bonusTotal)  + ((abl + bonus) * ( abl > 0 ? 3 : 2 ));
		const items = this.parent.items.filter( i => 'capacity' in i.system )
		this.capacity.value = items.reduce((acc, i) => {
			if ( i.system.packCapacity ) {
				acc += Math.floor( i.system.capacity / i.system.packCapacity ) * i.system.quantity
			} else {
				acc += i.system.capacity * i.system.quantity
			}
			return acc
		}, 0);
	}

	prepareFragmentsLimit() {
		const ability = this.abilities[this.fragments.abl]?.value ?? 0;
		this.fragments.max = ability + (this.proficiency * 2);
		const gear = this.parent.items.filter( i => i.system.equipped && i.system.attuned );
		let uuids = gear.map( i => i.system.sigils );
		uuids = uuids.reduce( (acc, i) => acc.concat(i), [] );
		let fragment = 0;
		for (const uuid of uuids) {
			if ( !uuid.parentUuid ) continue;
			const item = fromUuidSync(uuid.parentUuid);
			if ( !item.system.fragments.value ) continue;
			fragment += item.system.fragments.amount;
		}
		this.fragments.value = fragment;
	}

	getRollData() {
		const data = super.getRollData();
		return data;
	}

	
	/* -------------------------------------------- */
	/*  Database Operations                         */
	/* -------------------------------------------- */
	
	async _onCreate(data, options, userId) {

		if ( userId !== game.user.id ) return;
		const items = await Promise.all(SYSTEM.initialItems.map( i => fromUuid(i)));
		this.parent.createEmbeddedDocuments('Item', items.map( i => i.toObject()) );
		
	}

	/* -------------------------------------------- */
	/* Type Methods                                 */
	/* -------------------------------------------- */
	
	async _progression(){
		// console.groupCollapsed("PROGRESSION");
		const actor = this.parent;
		const characterLevel = this.level.value;
		const progression = {};
		const rootItems = ['legacy','curse','background','guild','bonus'];
		for ( let level = 1; level <= 12; level++) {
			const lvl = String(level).padStart(2, 0);
			const bonus = rootItems.indexOf('guild');
			rootItems.splice( bonus, 0, `class-${lvl}`);
		}
		const itemOrigin = actor.items.reduce((acc, item, i) => {
			if ( !('origin' in item.system) ) return acc;
			for (let origin of item.system.origin) {
				if ( origin == '' ) origin = `bonus-${i}`;
				acc.push({item: item, id: origin});
			}
			return acc;
		}, []);
		
		const prepareObj = function(bnft) {
			let item = itemOrigin.findSplice( j => j.id == bnft._id )?.item ?? null;
			
			if ( bnft._id == 'bonus' ) {
				item = {name: game.i18n.localize("SKYFALL2.Bonus")}
			} else if ( bnft._id == 'guild' ) {
				const guildId = ['guild-01'];
				let rank = game.i18n.localize("SKYFALL2.GUILD.Novice");
				if ( characterLevel > 4 ) {
					guildId.push('guild-02');
					rank = game.i18n.localize("SKYFALL2.GUILD.Veteran");
				}
				if ( characterLevel > 8 ) {
					guildId.push('guild-03');
					rank = game.i18n.localize("SKYFALL2.GUILD.Legend");
				}
				item = {
					name: game.i18n.localize("SKYFALL2.GUILD.Benefit"),
					system: {
						benefits: guildId.map(g => ({_id: g, type: 'feature'}))
					}
				}
			}
			const isLevelItem = ['class','path'].includes(bnft.type);
			const obj = {
				id: bnft._id, 
				type: bnft.type, // item ? item.type : type,
				item: item,
				level: Number(bnft.level),
				classLevel: isLevelItem && item ? item.system.origin.indexOf(bnft._id) + 1 : 0,
				granting: bnft.granting,
				query: bnft.query,
				empty: false,
				children: {feature:{}}
			}

			const benefits = item ? (item.system?.benefits ?? []) : [];
			if ( benefits.length == 0 ) obj.empty = true;
			for (const benefit of benefits) {
				if ( isLevelItem && benefit.level != obj.classLevel ) continue;
				if ( benefit.type == 'heritage' ) {
					if ( !foundry.utils.isEmpty(obj.children[benefit.type]) ) continue;
				}
				obj.children[benefit.type] ??= {};
				obj.children[benefit.type][benefit._id] = prepareObj(benefit);
			}
			if ( foundry.utils.isEmpty(obj.children) ) obj.empty = true;
			return obj;
		}
		let debugBreak = 0;
		for (const root of rootItems) {
			if( debugBreak >= 100 ) break;
			else debugBreak++;

			const [type, level] = root.split('-');
			if ( Number(level) > (characterLevel + 1) ) continue;
			const obj = prepareObj({
				_id: root,
				type: type,
				level: level,
			});
			progression[root] = obj;
			const index = rootItems.indexOf(root);
			const multiclass = type == 'class' && obj.item ? obj.item.system.initial : false;
			if ( root == 'class-02' ) rootItems.splice(index + 1, 0, 'path-01');
			else if ( multiclass && obj.classLevel == 2 ) rootItems.splice(index + 1, 0, 'feat-mc');
			else if ( obj.classLevel == 7 ) rootItems.splice(index + 1, 0, 'path-02');
		}
		itemOrigin.reduce((acc, v) => {
			acc[v.id] = {
				_id: v.id, item: v.item, empty: true,
			};
			return acc;
		}, progression.bonus.children.feature);
		
		// console.groupEnd();
		return progression;
	}
	
	async _applyConsumption() {}
	
}