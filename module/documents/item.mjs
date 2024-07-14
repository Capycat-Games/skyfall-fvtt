import ActorItemCreate from "../apps/actor-item-create.mjs";

/**
 * An Item subclass which handles system specific logic for the Item document type.
 */
export default class SkyfallItem extends Item {

	/* -------------------------------------------- */
	/*  Item Attributes                             */
	/* -------------------------------------------- */

	/**
	 * Item-specific configuration data which is constructed before any additional data preparation steps.
	 * @type {object}
	 */
	get config() {
		return this.system.config;
	}

	/* -------------------------------------------- */
	/*  Item Data Preparation                       */
	/* -------------------------------------------- */

	/** @override */
	prepareBaseData() {
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
				break;
			case "armor":
				break;
			case "equipment":
				break;
			case "consumable":
				break;
			case "loot":
				break;
		}
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
				this.system.hitDie.max = this.system.level;
				
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
	 * Provide an array of detail tags which are shown in each item description
	 * @param {string} [scope="full"]       The scope of tags being retrieved, "full" or "short"
	 * @returns {Object<string, string>}    The tags which describe this Item
	 */
	getTags(scope="full") {
		switch ( this.type ) {
			case "armor":
			case "feat":
			case "weapon":
				return this.system.getTags(scope);
			default:
				return {};
		}
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData(item = null) {
		const data = { ...super.getRollData() };
		if ( this.type == 'weapon' || (this.type == 'armor' && this.system.type == 'shield') ) {
			data['weapon'] = {};
			data.weapon = this.system.damage.formula;
		}
		if ( item ) data.item = item.getRollData();
		
		return data;
	}

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		return super._preCreate(data, options, user);
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _onCreate(data, options, userId) {
		await super._onCreate(data, options, userId);
		if ( !this.actor ) return;
		
		// Create Sigils In Parent Actor
		if ( foundry.utils.hasProperty(this, "system.sigils") ) {
			return this._createSigils(data, options, userId);
		}
		
		// Create Given Items
		let {features, abilities, heritages, feats} = data.system;
		if ( features?.length || abilities?.length || heritages?.length || feats?.length ) {
			// if ( [...features, ...abilities, ...heritages, ...feats].length ) {
			// PROMPT LIST FEATURES
			// PROMPT CHOOSE HERITAGE
			return new ActorItemCreate(options.parent, data).render(true);
		}
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

	/** @inheritdoc */
	async _preUpdate(data, options, user) {
		let allowed = super._preUpdate(data, options, user);
		return allowed;
	}

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
		const sigils = foundry.utils.getProperty(this, "system.sigils");
		const deleteDocuments = [];
		for (const sigil of sigils) {
			const uuid = parseUuid(sigil.parentUuid);
			deleteDocuments.push(uuid.id);
		}
		this.actor.deleteEmbeddedDocuments("Item", deleteDocuments);
	}

	/* -------------------------------------------- */

	/**
	 * Send Description to Chat
	 * @public
	 */
	async toMessage() {
		ChatMessage.create({
			content: `<h3>${this.name}</h3>${this.system.description.value}`,
		});
	}

	
	/** @inheritDoc */
	async _buildEmbedHTML(config, options={}) {
		config.caption = false;
		config.cite = false;
		const embed = await super._buildEmbedHTML(config, options);
		if ( !embed ) {
			if ( this.system._embed instanceof Function ) return this.system._embed(config, options);
		}
		return embed;
	}
}

