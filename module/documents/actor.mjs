import D20Roll from "../dice/d20-roll.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export default class SkyfallActor extends Actor {

	/* -------------------------------------------- */
	/*  Getters                                     */
	/* -------------------------------------------- */

	get allModifications(){
		const mods = [];
		mods.push( ...this.effects.filter(ef => ef.type == 'modification') );
		this.items.reduce( (acc, item) => {
			const efs = item.effects.filter(ef => ef.type == 'modification');
			acc.push(...efs);
			return acc;
		}, mods);
		return mods;
		//this.effects.filter( ef => ef.type == 'modification');
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @override */
	prepareData() {
		super.prepareData();
		console.log(`${this.documentName}.prepareData()`);
	}

	/** @override */
	prepareBaseData() {
		console.log(`${this.documentName}.prepareBaseData()`);
	}

	/** @override */
	prepareDerivedData() {
		console.log(`${this.documentName}.prepareDerivedData()`);
		const actorData = this;
		const systemData = actorData.system;
		const flags = actorData.flags.skyfall || {};
		
		// PREPARE HIT POINTS
		if ( true ) {
			const hitDie = systemData.resources.hitDie.die.replace(/\d+d/,'');
			let levels = [];
			if ( flags.hpPerLevel == 'roll' ) levels = [];
			else { //if ( flags.hpPerLevel == 'mean') {
				let mean = (((Number(hitDie)) / 2) + 1);
				levels = Array.fromRange(systemData.level.value).fill(mean, 0, 12);
			}
			levels[0] = Number(hitDie);
			systemData.resources.hp.max = levels.reduce((acc,i)=> acc+i) ?? 1;
			systemData.resources.hp.max += systemData.level.value * systemData.abilities.con.value;
		}

		// PREPARE HITDIE
		systemData.resources.hitDie.max = systemData.level.value;
		
		// PREPARE EMPHASYS POINTS
		systemData.resources.ep.max = systemData.level.value * 3;

		// PREPARE PROFICIENCIA
		
		// PREPARE PROTECTIONS
		for (const [key, abl] of Object.entries(systemData.abilities)) {
			abl.protection = 10 + abl.value + (abl.proficient ? systemData.proficiency : 0);
		}

		// PREPARE SKILLS
		for (const [key, skill] of Object.entries(systemData.skills)) {
			skill.roll = {};
			skill.roll['pro'] = systemData.proficiency * skill.value;
			for (const [abl, ability] of Object.entries(systemData.abilities)) {
				skill.roll[abl] = (systemData.proficiency * skill.value) + ability.value;
			}
		}

		// PREPARE DAMAGE REDUCTION
		systemData.dr = actorData.items.filter( i => 'dr' in i.system && i.system.equipped ).reduce((acc, i) => {
			acc += i.system.dr;
			return acc;
		}, 0);

		// PREPARE CAPACITY
		const str = systemData.abilities.str.value;
		systemData.capacity.max = 16 + ( str * ( str > 0 ? 3 : 2 ));
		systemData.capacity.value = actorData.items.filter( i => 'capacity' in i.system ).reduce((acc, i) => {
			acc += i.system.capacity;
			return acc;
		}, 0);
		
		// PREPARE FRAGMENTS LIMIT
		const cha = systemData.abilities.cha.value;
		systemData.fragments.max = cha + (systemData.proficiency * 2);
		
		// PREPARE DATA FROM CLASS
		const iniClass = actorData.items.find( it => it.type == 'class' && it.system.initial );
		if ( iniClass ) {
			systemData.resources.hitDie.die = iniClass.system.hitDie;
			// PREPARE SPELLCASTING ABILITY
			if ( iniClass.system.spellcasting ) {
				systemData.abilities[iniClass.system.spellcasting].spellcasting = true;
			}
		}
		
		this._prepareCharacterData(actorData);
		this._prepareNpcData(actorData);
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData) {
		if (actorData.type !== 'character') return;
		console.log(`${this.documentName}._prepareCharacterData()`);
		const systemData = actorData.system;
	}

	/**
	 * Prepare NPC type specific data.
	 */
	_prepareNpcData(actorData) {
		if (actorData.type !== 'npc') return;
		console.log(`${this.documentName}._prepareNpcData()`);
		const systemData = actorData.system;
		
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		const data = { ...super.getRollData() };
		for (const [key, abl] of Object.entries(data.abilities)) {
			data[key] = abl.value;
		}
		return data;
	}

	
	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// SET DEFAULT TOKEN
		const prototypeToken = {};
		if ( this.system.size ) {
			const size = SYSTEM.actorSizes[this.system.size].gridScale ?? 1;
			if ( !foundry.utils.hasProperty(data, "prototypeToken.width") ) prototypeToken.width = size;
			if ( !foundry.utils.hasProperty(data, "prototypeToken.height") ) prototypeToken.height = size;
		}
		if ( this.type === "character" ) {
			prototypeToken.sight = { enabled: true };
			prototypeToken.actorLink = true;
			prototypeToken.disposition = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
		}
		this.updateSource({ prototypeToken });
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _onCreate(data, options, user) {
		await super._onCreate(data, options, user);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _preUpdate(data, options, userId) {
		// SET DEFAULT TOKEN
		const prototypeToken = {};
		if ( data.system?.size ) {
			const size = SYSTEM.actorSizes[data.system.size].gridScale ?? 1;
			data.prototypeToken = {
				width: size,
				height: size
			}
		}
		return await super._preUpdate(data, options, userId);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	_onUpdate(data, options, userId) {
		return super._onUpdate(data, options, userId);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _preCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
		super._preCreateDescendantDocuments(parent, collection, documents, data, options, userId);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
		super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
	}

	/* -------------------------------------------- */

	#promptIndiviualItem(item){
		if( item.system.features ) {
			// LIST RECEIVED FEATURES
			// ADD TO CREATELIST
		}

		if( item.system.heritages ) {
			// PROMPT HERITAGE CHOICE
			// ADD TO CREATELIST
		}

		if( item.system.feats ) {
			// PROMPT FEAT CHOICE
			// ADD TO CREATELIST
		}
	}
	
	/** @inheritdoc */
	*allApplicableEffects(type = 'base') {
		for ( const effect of this.effects.filter( ef => ef.type == type ) ) {
			yield effect;
		}
		if ( CONFIG.ActiveEffect.legacyTransferral ) return;
		for ( const item of this.items ) {
			for ( const effect of item.effects.filter( ef => ef.type == type ) ) {
				if ( effect.transfer ) yield effect;
			}
		}
	}

	/* -------------------------------------------- */
	/*  Actions                                     */
	/* -------------------------------------------- */
	
	/**
	* Apply a certain amount of damage or healing to the health pool for Actor
	* @param {number} amount			 An amount of damage (positive) or healing (negative) to sustain
	* @param {number} multiplier	 A multiplier which allows for resistance, vulnerability, or healing
	* @return {Promise<Actor>}		 A Promise which resolves once the damage has been applied
	*/
	async applyDamage(roll, multiplier = 1, applyDR = false) {
		console.groupCollapsed( 'applyDamage' );
		console.log(roll, multiplier );
		// Get current resource values
		const hp = this.system.resources.hp;
		const ep = this.system.resources.ep;
		applyDR = multiplier == -1 ? false : applyDR;
		const dr = this.system.dr;
		let drTypes = this.system.modifiers.damage.taken;
		const drMods = {nor:1, imu:0, res:0.5, vul:1.5 };
		drTypes = Object.entries(drTypes).reduce( (acc, dr ) => {
				acc[dr[0]] = drMods[dr[1]];
				return acc;
		}, {});
		console.log(drTypes);

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
			console.log(type, dmg, multiplier, typeMod);
			dmg = Math.floor(dmg * Number(multiplier) * Number(typeMod) );
			damage += dmg;
		}
		console.log( damage );
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
		console.log(updateData);

		await this.update(updateData);
		
		console.groupEnd();
		return;
	}

	async rollCheck({type='ability',id='str',abl='str'}){
		const terms = [ {term: '1d20', options: {flavor: '', name: 'd20', source: ''}}, ];
		const rollData = this.getRollData();
		terms.push( {term: `@${abl}`, options: {flavor: '', name: 'ability', source: ''}} );

		if ( type == 'skill' ) {
			terms.push( {term: `@prof`, options: {flavor: '', name: 'proficiency', source: ''}} );
			rollData['prof'] = this.system.skills[id].roll.pro;
		}
		let rollConfig = {
			advantage: 0, disadvantage: 0,
			rollData: rollData,
			terms: terms,
		}
		if ( false ) {
			/** TODO - USAGE EFFECTS DIALOG
			 * Prepare available UsageEffects Apply to to
			 * config = UsageEffectsConfig(this, rollConfig);
			 * config.apply(target);
			 */
		} else {
			const roll = D20Roll.fromConfig( rollConfig );
			await roll.configureDialog({title:"SKYFALL.ROLL.CONFIG", type:type, ability: abl});
			await roll.toMessage({
				flavor: game.i18n.format( `SKYFALL.ROLL.${type.toUpperCase()}`, {
					skill: id ? game.i18n.localize(`SKYFALL.ACTOR.SKILLS.${id.toUpperCase()}`) : '',
					abl: game.i18n.localize(`SKYFALL.ACTOR.ABILITIES.${abl.toUpperCase()}`),
				})
			});
			if ( type='initiative' && roll ) {
				try {
					let combat = game.combats.active;
					if (!combat) return;
					let combatant = combat.combatants.find(
						(c) => c.actor.id === this.id
					);
					if ( !combatant || combatant.initiative != null ) return;
					combat.setInitiative(combatant.id, roll.total);
					console.log(`Foundry VTT | Iniciativa Atualizada para ${combatant._id} (${combatant.actor.name})`);
				} catch (error) {
					console.warn(`Foundry VTT | Erro ao adicionar a Iniciativa, ${combatant._id} (${combatant.actor.name})`);
				}
			}
		}

	}
}
