import RollConfig from "../apps/roll-config.mjs";
import { SYSTEM } from "../config/system.mjs";
import { actor } from "../data/_module.mjs";
import D20Roll from "../dice/d20-roll.mjs";
import SkyfallRoll from "../dice/skyfall-roll.mjs";

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

	get classes() {
		return this.items.filter(it => it.type == 'class');
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @override */
	prepareData() {
		super.prepareData();
	}

	/** @override */
	prepareBaseData() {
		// ABILITIES
		for (let [key, abl] of Object.entries(this.system.abilities)) {
			abl.label = SYSTEM.abilities[key].abbr;
		}

		// SKILLS
		for (let [key, skill] of Object.entries(this.system.skills)) {
			skill.id = key;
			skill.label = SYSTEM.skills[key] ? game.i18n.localize(SYSTEM.skills[key].label) : (skill.label || "SKILL");
			skill.icon = [SYSTEM.icons.square, SYSTEM.icons.check, SYSTEM.icons.checkdouble][skill.value];
			skill.type = SYSTEM.skills[key]?.type ?? 'apti' ?? 'custom';
		}
	}

	/** @override */
	prepareDerivedData() {
		const actorData = this;
		const systemData = actorData.system;
		const flags = actorData.flags.skyfall || {};

		// PREPARE HIT POINTS
		let hpPerLevelMethod = game.settings.get('skyfall', 'hpPerLevelMethod');
		if( hpPerLevelMethod == 'user' ) {
			hpPerLevelMethod = this.getFlag('skyfall','hpPerLevelMethod');
		}
		if ( this.type != "character"){
		} else if( hpPerLevelMethod == 'mean' ) this.prepareMaxHPMean();
		else if( hpPerLevelMethod == 'roll' ) this.prepareMaxHPRoll();
		const { hp, ep } = systemData.resources;
		systemData.resources.hp.pct = Math.round(hp.value * 100 / hp.max);
		systemData.resources.hp.tpct = Math.round(hp.temp * 100 / hp.max);
		systemData.resources.hp.negative = hp.value < 0 ;
		
		// PREPARE EMPHASYS POINTS
		systemData.resources.ep.max = systemData.level.value * 3;
		systemData.resources.ep.pct = Math.round(ep.value * 100 / ep.max);
		systemData.resources.ep.tpct = Math.round(ep.temp * 100 / ep.max);
		
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
		if ( this.type == "character" ) {
			systemData.dr = actorData.items.filter( i => 'dr' in i.system && i.system.equipped ).reduce((acc, i) => {
				acc += i.system.dr;
				return acc;
			}, 0);
		}
		
		// PREPARE CAPACITY
		const str = systemData.abilities.str.value;
		systemData.capacity.max = 16 + ( str * ( str > 0 ? 3 : 2 ));
		systemData.capacity.value = actorData.items.filter( i => 'capacity' in i.system ).reduce((acc, i) => {
			acc += i.system.capacity;
			return acc;
		}, 0);
		
		// PREPARE FRAGMENTS LIMIT
		let fragAbl = systemData.fragments.abl;
		fragAbl = systemData.abilities[fragAbl].value ?? 0;
		systemData.fragments.max = fragAbl + (systemData.proficiency * 2);
		systemData.fragments.value = this.items.filter( i => i.type=='sigil' && i.system.infused).reduce((acc, i) => {
			acc += i.system.fragments.amount;
			return acc;
		}, 0);
		
		if ( systemData.spellcasting ) {
			systemData.abilities[systemData.spellcasting].spellcasting = true;
		}
		// PREPARE DATA FROM CLASS
		const iniClass = actorData.items.find( it => it.type == 'class' && it.system.initial );
		if ( iniClass ) {
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
		const systemData = actorData.system;
	}

	/**
	 * Prepare NPC type specific data.
	 */
	_prepareNpcData(actorData) {
		if (actorData.type !== 'npc') return;
		const systemData = actorData.system;
		
	}

	prepareMaxHPMean(){
		const systemData = this.system;
		const hpConfig = systemData.modifiers.hp;
		const classes = this.classes;
		const rollData = this.getRollData();
		const hpData = {abl:0};
		systemData.level.value = 0;
		for (const cls of classes) {
			systemData.level.value += cls.system.level;
			const die = cls.system.hitDie.die.replace(/\d+d/,'');
			const mean = (((Number(die)) / 2) + 1); 
			
			if ( cls.system.initial ) hpData.dieMax = Number(die);
			hpData.dieMean ??= 0;
			hpData.dieMean += mean * (cls.system.level - (cls.system.initial?1:0));
		}
		
		// Level -1 - first level is maxed
		hpData.level = (systemData.level.value ?? 1) - 1;
		// Sum of ability
		if ( hpConfig.abilities.length == 0 ) hpConfig.abilities = ['con'];
		hpData.abl = hpConfig.abilities.reduce((acc, abl) => acc + rollData[abl], 0);
		// Sum of bonus per level
		hpData.levelExtra = hpConfig.levelExtra.reduce((acc, bns) => {
			return acc + Number(rollData[bns] || bns || 0);
		}, 0);
		// Sum of bonus health
		hpData.totalExtra =  hpConfig.totalExtra.reduce((acc, bns) => {
			return acc + Number(rollData[bns] || bns || 0);
		}, 0);

		// Pseudo Roll to calculate total hp
		console.warn(systemData, hpConfig, rollData, hpData);
		const roll = new SkyfallRoll(`@dieMax + @dieMean + @abl + @levelExtra + ((@abl + @levelExtra) * @level) + @totalExtra`, hpData);
		roll.evaluateSync();
		
		// Set max HIT POINTS
		systemData.resources.hp.max = roll.total;
	}
	prepareMaxHPRoll(){
		// TODO
	}
	
	/** @inheritDoc */
	applyActiveEffects(){
		super.applyActiveEffects();
	}
	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		const data = { ...super.getRollData() };
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
		this.someProperty = "XABLAU";
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
	/*  Methods                                     */
	/* -------------------------------------------- */
	
	/* -------------------------------------------- */

	async modifyTokenAttribute(attribute, value, isDelta=false, isBar=true) {
		const attr = foundry.utils.getProperty(this.system, attribute);
		const current = isBar ? attr.value : attr;
		const update = isDelta ? current + value : value;
		if ( update === current ) return this;

		// Determine the updates to make to the actor data
		let updates;
		if ( isBar ) updates = {[`system.${attribute}.value`]: Math.clamp(update, (attr.max * -1), attr.max)};
		else updates = {[`system.${attribute}`]: update};

		// Allow a hook to override these changes
		const allowed = Hooks.call("modifyTokenAttribute", {attribute, value, isDelta, isBar}, updates);
		return allowed !== false ? this.update(updates) : this;
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

		await this.update(updateData);
		
		console.groupEnd();
		return;
	}

	async rollCheck({type='ability',id='str',abl='str'}, options){
		const roll = await new RollConfig({
			type: type,
			ability: abl,
			skill: id,
			actor: this,
			createMessage: true,
			skipConfig: options.skipConfig ?? false,
			advantageConfig: options.advantageConfig ?? 0,
		}).render( !(options.skipConfig ?? false) );
		
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
		return;
		
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

	/** @inheritdoc */
	async rollInitiative({createCombatants=false, rerollInitiative=false, initiativeOptions={}}={}) {
		const roll = await new RollConfig({
			type: 'initiative',
			ability: 'dex',
			// skill: null,
			actor: this,
			createMessage: true,
			skipConfig: initiativeOptions.skipConfig ?? false,
			advantageConfig: initiativeOptions.advantageConfig ?? 0,
		}).render( !(initiativeOptions.skipConfig ?? false) );
		
		return;
		return super.rollInitiative({createCombatants, rerollInitiative, initiativeOptions});
	}

	async shortRest(message){
		const updateData = message.system.restUpdate;
		// TODO UPDATE ITEMS USES
		this.update(updateData);
	}

	async longRest(){
		const systemData = this.system;
		const updateData = {};
		const quality = await Dialog.prompt({
			title: game.i18n.localize("SKYFALL.SHEET.NEWSKILL"),
			content: `<form><div class="form-group"><label>${game.i18n.localize("SKYFALL.QUALITY")}</label><select type="text" name="quality"><option value="bad">Ruim</option><option value="default" selected>Padrão</option><option value="good">Bom</option></select></div></form>`,
			callback: html => {
				return html[0].querySelector('select').value
			},
			options: {width: 260}
		});

		updateData['system.resources.hp.value'] = systemData.resources.hp.max;
		updateData['system.resources.ep.value'] = systemData.resources.ep.max;
		updateData['items'] = [];
		const classes = this.classes;
		for (const cls of classes) {
			let hd = (quality == "bad" ? Math.floor(cls.system.hitDie.max/2) : cls.system.hitDie.max);
			updateData['items'].push({
				_id: cls.id,
				"system.hitDie.value": cls.system.hitDie.max,
			});
		}
		// TODO UPDATE ITEMS USES
		this.update(updateData);
	}

	async toggleStatusEffect(statusId, {active, overlay=false}={}) {
		const rightClick = overlay ? true : false;
		if ( overlay ) overlay = false; // DEAD is the only overlay;
		if ( statusId === 'dead' ) overlay = true;
		let status = SYSTEM.conditions[statusId];
		if ( status?.system?.stack ) {
			const effect = this.effects.find(ef => ef.id.startsWith(statusId) );
			if ( effect && effect.stack > 1 ) {
				return effect.stack =  rightClick ? -1 : 1;
			} //else if ( !effect ) return;
		}
		return super.toggleStatusEffect(statusId, {active, overlay}) 
	}

}
