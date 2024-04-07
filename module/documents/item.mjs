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
}

