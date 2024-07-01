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
	}

	/* -------------------------------------------- */

	/**
	 * Prepare additional data for SOME type Items.
	 */
	_prepareSomeData() {
		const SOMEITEM = this.system || {};
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
		await super._preCreate(data, options, user);
		if ( this.isOwned ) {
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
		}
	}

	/** @inheritDoc */
	async _onCreate(data, options, user) {
		await super._onCreate(data, options, user);
		
		// Create Given Items
		if ( !this.actor ) return;
		let {features, abilities, heritages, feats} = data.system;
		if ( features?.length || abilities?.length || heritages?.length || feats?.length ) {
			// if ( [...features, ...abilities, ...heritages, ...feats].length ) {
			// PROMPT LIST FEATURES
			// PROMPT CHOOSE HERITAGE
			return new ActorItemCreate(options.parent, data).render(true);
		}
	}
	
	/* -------------------------------------------- */

	/** @inheritdoc */
	_onUpdate(data, options, userId) {
		
		return super._onUpdate(data, options, userId);
	}

	/* -------------------------------------------- */

	/**
	 * Do Something.
	 * @private
	 */
	_someFunction(changed) {
		if ( !this.isOwned ) return;
		if ( !["armor", "weapon"].includes(this.type) ) return;
		const tokens = this.actor.getActiveTokens(true);

		// Equipment changes
		if ( changed.system?.equipped !== undefined ) {
			const text = `${changed.system.equipped ? "+" : "-"}(${this.name})`;
			const fontSize = 24 * (canvas.dimensions.size / 100).toNearest(0.25);
			for ( let token of tokens ) {
				canvas.interface.createScrollingText(token.center, text, {
					anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
					direction: CONST.TEXT_ANCHOR_POINTS[changed.system.equipped ? "TOP" : "BOTTOM"],
					fontSize: fontSize,
					stroke: 0x000000,
					strokeThickness: 4
				});
			}
		}
	}

	
	/** @inheritDoc */
	async _buildEmbedHTML(config, options={}) {
		console.log( config );
		config.caption = false;
		config.cite = false;
		const embed = await super._buildEmbedHTML(config, options);
		console.log(embed);
		if ( !embed ) {
			if ( this.system._embed instanceof Function ) return this.system._embed(config, options);
		}
		return embed;
	}
}

