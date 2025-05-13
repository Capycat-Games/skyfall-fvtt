import ActorItemCreate from "../apps/actor-item-create.mjs";

/**
 * An Item subclass which handles system specific logic for the Item document type.
 */
export default class SkyfallItem extends Item {

	/* -------------------------------------------- */
	/*  Item Attributes                             */
	/* -------------------------------------------- */
	
	static async createDialog(data={}, {parent=null, pack=null, types, ...options}={}) {
		super.createDialog(data, {parent, pack, types, ...options });
	}
	/**
	 * Item-specific configuration data which is constructed before any additional data preparation steps.
	 * @type {object}
	 */
	get config() {
		return this.system.config;
	}

	get damageType () {
		if ( !this.system.descriptors ) return '';
		const type = this.system.descriptors.find( d => SYSTEM.DESCRIPTOR.DAMAGE[d] );
		const heal = this.system.descriptors.find( d => d == 'heal' );
		return heal ?? type ?? '';
	}

	/* -------------------------------------------- */
	/*  Item Data Preparation                       */
	/* -------------------------------------------- */

	/** @override */
	prepareBaseData() {
		return super.prepareBaseData();
	}

	/* -------------------------------------------- */

	/** @override */
	prepareDerivedData() {
		switch ( this.type ) {
			case "legacy":
				break;
			case "curse":
				break;
			case "background":
				break;
			case "class":
				break;
			case "path":
				break;
			case "feature":
				break;
			case "feat":
				break;
			case "ability":
				break;
			case "spell":
				break;
			case "weapon":
				this._getMagicName();
				break;
			case "armor":
				this._getMagicName();
				break;
			case "equipment":
				break;
			case "consumable":
				break;
			case "loot":
				break;
		}
		
		
	}

	/* -------------------------------------------- */

	/**
	 * Prepare additional data for SOME type Items.
	 */
	_getMagicName() {
		if ( !this.parent ) return;
		const sigils = { prefix: [], sufix: [] };
		this.parent.items.filter( i => i.type == "sigil" && i.system.item == this.uuid ).reduce((acc, sigil) => {
			acc[sigil.system.type].push(sigil.name);
			return acc;
		}, sigils );
		const pre = sigils.prefix.join(' ');
		const suf = sigils.sufix.join(' ');
		this.magicName = `${this.name} ${pre} ${suf}`.trim();
	}

	/* -------------------------------------------- */
	/*  Helper Methods                              */
	/* -------------------------------------------- */

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData(item = null) {
		const data = {
			...super.getRollData(),
			...this.system.getRollData(),
		};
		// FIXME send to SystemTypeData
		if ( this.type == 'weapon' || (this.type == 'armor' && this.system.type == 'shield') ) {
			data['weapon'] = {};
			data.weapon = this.system.damage.formula;
		}
		
		if ( item ) data.item = item.getRollData();
		
		return data;
	}

	/* -------------------------------------------- */
	/*  System Methods                              */
	/* -------------------------------------------- */

	/**
	 * Send Description to Chat
	 * @public
	 */
	async toMessage() {
		const catharsis = this.type == 'feature' && this.system.catharsis;
		const regex = new RegExp(/\(|\)|Melancolia|Evento Marcante|Lema de Guilda|Maldição/gi);
		const name = catharsis ? this.name.replaceAll(regex, '') : this.name;
		const description = this.system.description.value;
		ChatMessage.create({
			content: catharsis ? description : `<h3>${name}</h3>${description}`,
			flavor: catharsis ? `<h1>${name}</h1>` : '',
			speaker: ChatMessage.getSpeaker({actor: this.actor}),
			system: {
				catharsis: catharsis,
			}
		});
	}

	static async abilityUse(event, abilityUuid, itemUuid) {
		const ability = fromUuidSync(abilityUuid);
		const item = fromUuidSync(itemUuid);
		const abilityTypes = ["ability", "spell", "sigil", "guild-ability"];
		const weaponTypes = ["weapon", "armor"];
		if ( ability && abilityTypes.includes(ability.type) ) {
			return await ability.system.abilityUse(event, item);
		} else if ( item && weaponTypes.includes(item.type) ) {
			return await item.system.weaponUse(event);
		} else {
			return ui.notifications.warn('Item is not of valid type');
		}
	}

	static async weaponUse(event, itemUuid) {
		const item = fromUuidSync(itemUuid);
		if ( !["weapon", "armor"].includes(item.type) ) {
			return ui.notifications.warn('Item is not of valid type');
		} else await item.system.weaponUse(event, item);
	}


	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		let allowed = super._preCreate(data, options, user);
		return allowed;
	}

	/* -------------------------------------------- */

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		await super._onCreate(data, options, userId);
		if ( !this.actor ) return;
		
		// Create Sigils In Parent Actor
		if ( foundry.utils.hasProperty(this, "system.sigils") ) {
			return this._createSigils(data, options, userId);
		}
		return;
	}
	
	/* -------------------------------------------- */
	
	async _createSigils(data, options, userId){
		if ( game.user.id !== userId ) return false;
		const sigils = foundry.utils.getProperty(this, "system.sigils");
		const createItems = [];
		for (const sigil of sigils) {
			let item = await fromUuid(sigil.uuid);
			item = item.toObject();
			item.system.fragments.value = sigil.infused;
			item.system.item = this.uuid;
			if ( sigil.uuid.startsWith('Compendium') ) {
				item._stats.compendiumSource = sigil.uuid;
			} else {
				item._stats.duplicateSource = sigil.uuid;
			}
			createItems.push(item)
		}
		if ( createItems ) {
			const created = await this.actor.createEmbeddedDocuments("Item", createItems);
			const updateData = {};
			updateData['system.sigils'] = sigils;
			
			for (const [i, doc] of created.entries() ) {
				updateData['system.sigils'][i].parentUuid = doc.uuid;
			}
			this.update(updateData);
		}
		return false;
	}

	/* -------------------------------------------- */

	// /** @inheritdoc */
	// async _preUpdate(changed, options, user) {
	// 	let allowed = super._preUpdate(changed, options, user);
	// 	return allowed;
	// }

	/** @inheritdoc */
	async _onUpdate(data, options, userId) {
		return super._onUpdate(data, options, userId);
	}

	/* -------------------------------------------- */

	async _preDelete(options, user) {
		super._preDelete(options, user);
	}

	/** @inheritDoc */
	_onDelete(options, userId) {
		super._onDelete(options, userId);
		
		// Delete Sigils in Parent Actor
		if ( foundry.utils.hasProperty(this, "system.sigils") ) {
			return this._deleteSigils(options, userId);
		}
	}

	/* -------------------------------------------- */

	async _deleteSigils(options, userId){
		if ( game.user.id != userId ) return;
		if ( !this.isEmbedded ) return;
		const sigils = foundry.utils.getProperty(this, "system.sigils");
		const deleteDocuments = [];
		for (const sigil of sigils) {
			const uuid = parseUuid(sigil.parentUuid);
			deleteDocuments.push(uuid.id);
		}
		if ( deleteDocuments.length ) {
			this.actor.deleteEmbeddedDocuments("Item", deleteDocuments);
		}
	}

	/* -------------------------------------------- */

}

