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
		let allowed = super._preCreate(data, options, user);
		if ( allowed && this.parent ) allowed = await this._preCreateUniqueItem(data, options, user);
		return allowed;
	}

	/* -------------------------------------------- */

	async _preCreateUniqueItem( data, options, user ){
		console.log( data, options, user );
		const { DialogV2 }  = foundry.applications.api;

		const uniques = ["legacy", "curse", "background", "class", "path"];
		// ALLOW DUPLICATE OF [ "feature", "feat", "ability", "spell" ] ?;
		if ( !uniques.includes(data.type) ) return true;
		if ( !user.isSelf ) return false;
		const items = this.parent.items.filter( i => i.type == data.type );
		let allowed = true;
		if ( items.length == 0 ) return allowed;
		if ( data.type == 'class' ) {
			// WHEN EXISTING CLASS UPDATE LEVEL
			const item = items.find( i => i.name == data.name );
			if ( item ) {
				await item.update({"system.level": item.system.level + 1 });
				this.parent.sheet.render();
				allowed = false;
			}
		} else if ( data.type == 'path' && items.length == 1 ) {

		} else if ( data.type == 'path' && items.length > 1 ) {
			// WHEN EXISTING PATH UPDATE LEVEL
			ui.notifications.warn(
				game.i18n.localize("SKYFALL2.NOTIFICATION.PathsLimitReached")
			);
			allowed = false;
		} else {
			allowed = await DialogV2.confirm({
				content: game.i18n.format("SKYFALL2.DIALOG.OverwriteExistingItem", {
					actor: this.parent.name,
					type: game.i18n.localize(`TYPES.Item.${data.type}`),
				})
			});
			if ( allowed ) {
				const item = items.pop();
				this.parent.deleteEmbeddedDocuments("Item", [item.id]);
			}
		}
		return allowed;
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
		
		// Create Granted Items
		let {features, abilities, heritages, feats} = data.system;
		if ( features?.length || abilities?.length || heritages || feats?.length ) {
			const createItems = [];
			const updateData = {};
			if ( features?.length ) {
				await this._promptGrantedItems( features, createItems, userId );
			}

			if ( heritages ) {
				await this._promptLegacyHeritage( heritages, createItems, updateData, userId );
			}

			if ( abilities?.length ) {
				await this._promptGrantedItems( abilities, createItems, userId );
			}
			
			if ( createItems.length ) {
				this.parent.createEmbeddedDocuments("Item", createItems);
			}
			if ( updateData ) {
				this.update( updateData );
			}

			// return new ActorItemCreate(options.parent, data).render(true);
		}
	}

	/* -------------------------------------------- */
	
	async _promptLegacyHeritage( heritages, createItems, updateData, userId){
		if ( game.user.id != userId ) return;
		const { DialogV2 }  = foundry.applications.api;
		let li = '';
		for (const [key, heritage] of Object.entries( heritages ) ) {
			li += `<li class="item entry flexrow">
				<label class="flex2 flexrow" data-tooltip="${heritage.description}">
					${heritage.name}
				</label>
				<div class="item-controls flex0">
					<input type="radio" name="chosen" value="${key}">
				</div>
			</li>`;
		}
		const div = document.createElement('div');
		div.innerHTML = '<ul class="list-items flexcol plain">'+ li +'</ul>';
		const chosen = await DialogV2.prompt({
			window: {
				title: game.i18n.localize("SelectHeritage")
			},
			position: { width: 300 },
			content: div.outerHTML,
			ok: {
				callback: (event, button, dialog) => button.form.elements.chosen.value
			}
		});
		if ( !chosen ) return;
		updateData[`system.heritages.${chosen}.chosen`] = true;
		const grantedList = heritages[chosen].features;
		await this._promptGrantedItems( grantedList, createItems, userId );
		return;
	}

	async _promptGrantedItems(grantedList, createItems, userId){
		if ( game.user.id != userId ) return;
		const { DialogV2 }  = foundry.applications.api;
		let li = '';
		let type = '';
		for ( const uuid of grantedList ) {
			const item = fromUuidSync(uuid);
			if ( !item ) continue;
			type = item.type;
			li += `<li class="item entry flexrow">
				<img src="${item.img}" class="flex0" width=36 height=36>
				<label class="flex2 flexrow">${item.name}
				</label>
				<div class="item-controls flex0">
					<input type="checkbox" name="item_create" value="${uuid}" checked>
				</div>
			</li>`;
		}
		const div = document.createElement('div');
		div.innerHTML = '<ul class="list-items flexcol plain">'+ li +'</ul>';
		const granted = await DialogV2.prompt({
			window: {
				title: game.i18n.format("SKYFALL2.DIALOG.CreateGrantedItems",{
					type: type + "PL"
				})
			},
			position: { width: 300 },
			content: div.outerHTML,
			ok: {
				callback: (event, button, dialog) => {
					const item_create = button.form.elements.item_create;
					let to_create = item_create.length ? [ ...item_create ] : [ item_create ];
					to_create = to_create.map(i => i.checked ? i.value : null )
					return to_create.filter(Boolean);
				}
			}
		});
		for ( const uuid of granted ) {
			const item = await fromUuid( uuid );
			if ( !item ) continue;
			createItems.push( item.toObject(true) );
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

