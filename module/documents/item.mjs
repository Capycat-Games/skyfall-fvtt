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
		// if ( allowed && this.parent ) allowed = this._precreateValidateParent();
		// if ( allowed && this.parent ) allowed = await this._preCreateUniqueItem(data, options, user);
		return allowed;
	}

	/* -------------------------------------------- */
	/* DEPRECATE */
	_precreateValidateParent(){
		const actorTypes = {
			character: [
				"legacy", 'heritage', "curse", "background", "class", "path", "feature", "feat", "ability", "spell", "weapon", "armor", "clothing", "equipment", "consumable", "loot", "sigil"
			],
			creation: [
				"feature",
			],
			npc: [
				"feature", "ability", "spell",
				"weapon", "armor", "clothing", "equipment", "consumable", "loot", "sigil"
			],
			partner: [
				"feature", "ability", "spell",
				"weapon", "armor", "clothing", "equipment", "consumable", "loot", "sigil"
			],
			guild: [
				"seal", "facility", "guild-ability", "guild-feature",
				"weapon", "armor", "clothing", "equipment", "consumable", "loot", "sigil"
			]
		}
		if ( actorTypes[this.parent.type].includes(this.type) ) return true;
		else {
			ui.notifications.warn(
				game.i18n.localize("SKYFALL2.NOTIFICATION.InvalidParentType")
			);
			return false;
		}
	}
	/* DEPRECATE */
	async _preCreateUniqueItem( data, options, user ){
		const { DialogV2 }  = foundry.applications.api;

		const uniques = ["legacy", "heritage", "curse", "background", "class", "path"];
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
				if ( Object.values(item.system._benefits[level]).some(i => i.length) ) {
					const { BenefitsDialog } = skyfall.applications;
					BenefitsDialog.prompt({item: item});
				}
				this.parent.sheet.render();
				allowed = false;
			}
		} else if ( data.type == 'path' ) {
			if ( items.length == 1  ) {
				const item = items.find( i => i.name == data.name );
				// WHEN EXISTING CLASS UPDATE LEVEL
				if ( item ) {
					const current = item.system.origin;
					const level = item.system.level + 1;
					const lvl = String(level).padStart(2,0);
					current.push(`path-${lvl}`);
					console.warn('system.origin', current);
					await item.update({"system.origin": current });
					if ( Object.values(item.system._benefits[level]).some(i => i.length) ) {
						const { BenefitsDialog } = skyfall.applications
						BenefitsDialog.prompt({item: item});
					}
					this.parent.sheet.render();
					allowed = false;
				} else {
					// console.warn(this);
					console.warn('system.origin', ['path-02']);
					this.updateSource({"system.origin": ['path-02'] });
					allowed = true;
				}

			} else if ( items.length > 1 ) {
				// WHEN EXISTING PATH UPDATE LEVEL
				ui.notifications.warn(
					game.i18n.localize("SKYFALL2.NOTIFICATION.PathsLimitReached")
				);
				allowed = false;
			} else {
				console.warn('system.origin', ['path-01']);
				this.updateSource({"system.origin": ['path-01'] });
				allowed = true;
			}
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
		return;
	}

	/* -------------------------------------------- */
	/* DEPRECATE */
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

	/* DEPRECATE */
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
					type: type + "Pl"
				})
			},
			position: { width: 300 },
			content: div.outerHTML,
			ok: {
				callback: (event, button, dialog) => {
					const item_create = button.form.elements.item_create ?? [];
					let to_create = item_create.length ? [ ...item_create ] : [ item_create ];
					to_create = to_create.map(i => i.checked ? i.value : null )
					return to_create.filter(Boolean);
				}
			}
		});
		
		for ( const [i, uuid] of granted.entries() ) {
			const item = await fromUuid( uuid );
			if ( !item ) continue;
			const itemData = item.toObject(true);
			itemData._stats.compendiumSource = uuid;
			createItems.push( itemData );
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

	// /** @inheritdoc */
	// async _preUpdate(data, options, user) {
	// 	let allowed = super._preUpdate(data, options, user);
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
			speaker: ChatMessage.getSpeaker(),
			system: {
				catharsis: catharsis,
			}
		});
	}
}

