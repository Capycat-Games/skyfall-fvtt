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
		
		// PREPARE VIDA
		
		// PREPARE ENFASE
		
		// PREPARE PROFICIENCIA
		
		// PREPARE PROTECOES
		console.log(systemData)
		for (const [key, abl] of Object.entries(systemData.abilities)) {
			abl.protection = 10 + abl.value + (abl.proficient ? systemData.proficiency : 0);
		}
		// PREPARE VOLUME
		const str = systemData.abilities.str.value;
		systemData.capacity.max = 16 + ( str * ( str > 0 ? 3 : 2 ));
		
		// PREPARE FRAGMENTO
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

		return data;
	}

	
	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);
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
}
