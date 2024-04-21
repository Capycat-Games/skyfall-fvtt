import D20Roll from "../dice/d20-roll.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export default class SkyfallActor extends Actor {
	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @override */
	prepareData() {
		super.prepareData();
		console.log("ACTOR.prepareData()");
	}

	/** @override */
	prepareBaseData() {
		console.log("ACTOR.prepareBaseData()");
		if ( false ) {
			const system = this.system;
			for (const [key, abl] of Object.entries(system.abilities)) {
				abl.protection = 10 + abl.value + (abl.proficiency ? system.proficiency : 0);
			}
		}
	}

	/**
	 * @override
	 */
	prepareDerivedData() {
		console.log("ACTOR.prepareDerivedData()");
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
		
		this._prepareCharacterData(actorData);
		this._prepareNpcData(actorData);
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData) {
		if (actorData.type !== 'character') return;
		console.log("ACTOR._prepareCharacterData()");
		const systemData = actorData.system;
	}

	/**
	 * Prepare NPC type specific data.
	 */
	_prepareNpcData(actorData) {
		if (actorData.type !== 'npc') return;
		console.log("ACTOR._prepareNpcData()");
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
		await super._preCreate(data, options, user);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _preUpdate(data, options, userId) {
		console.log( data, options, userId );
		// SET DEFAULT TOKEN
		const prototypeToken = {};
		if ( data.system.size ) {
			const size = SYSTEM.actorSizes[data.system.size].gridScale ?? 1;
			data.prototypeToken = {
				width: size,
				height: size
			}
		}
		return await super._onUpdate(data, options, userId);
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
	

	/* -------------------------------------------- */
	/*  Actions                                     */
	/* -------------------------------------------- */
	
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
			console.log( roll );
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
