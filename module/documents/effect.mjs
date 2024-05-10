
export default class SkyfallEffect extends ActiveEffect {
	/* -------------------------------------------- */
	/*  Getters                                     */
	/* -------------------------------------------- */

	get cost(){
		const cost = {value: 1, resource:'ep', label: ``};
		cost.label = `+${cost.value} `;
		cost.label += game.i18n.localize(`SKYFALL.ACTOR.RESOURCES.${cost.resource.toUpperCase()}ABBR`);
		return cost;
	}

	get modTypes(){
		const types = {value: ['add'], label: ``};
		types.label = types.value.map( t => game.i18n.localize(`SKYFALL.MODIFICATION.TYPES.${t.toUpperCase()}`)).join(' ');
		types.label = `[${types.label}]`;
		types.label = types.label.toUpperCase();
		return types;
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @override */
	prepareData() {
		console.log(`${this.documentName}.prepareData()`, this.id);
		super.prepareData();
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
	}
	
	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	/**
	 * Create an ActiveEffect instance from some status effect ID.
	 * Delegates to {@link ActiveEffect._fromStatusEffect} to create the ActiveEffect instance
	 * after creating the ActiveEffect data from the status effect data if `CONFIG.statusEffects`.
	 * @param {string} statusId                             The status effect ID.
	 * @param {DocumentModificationContext} [options={}]    Additional options to pass to ActiveEffect instantiation.
	 * @returns {Promise<ActiveEffect>}                     The created ActiveEffect instance.
	 * @throws    An error if there's not status effect in `CONFIG.statusEffects` with the given status ID,
	 *            and if the status has implicit statuses but doesn't have a static _id.
	 */
	static async fromStatusEffect(statusData, options={}) {
		if ( typeof statusData === "string" ) statusData = CONFIG.statusEffects.find(e => e.id === statusData);
		if ( foundry.utils.getType(statusData) !== "Object" ) return;
		const createData = {
			...foundry.utils.deepClone(statusData),
			_id: foundry.utils.randomID(16),
			disabled: false,
			name: game.i18n.localize(statusData.name),
			statuses: [statusData.id, ...statusData.statuses ?? []]
		};
		this.migrateDataSafe(createData);
		this.cleanData(createData);
		return new this(createData, { keepId: true, ...options });
	}

	// /** @inheritDoc */
	// async _preCreate(data, options, user) {
	// 	await super._preCreate(data, options, user);
	// }

	// /* -------------------------------------------- */

	// /** @inheritDoc */
	// async _onCreate(data, options, user) {
	// 	await super._onCreate(data, options, user);
	// }

	// /* -------------------------------------------- */

	// /** @inheritdoc */
	// async _preUpdate(data, options, userId) {
	// 	return await super._preUpdate(data, options, userId);
	// }

	// /* -------------------------------------------- */

	// /** @inheritdoc */
	// _onUpdate(data, options, userId) {
	// 	return super._onUpdate(data, options, userId);
	// }

	/* -------------------------------------------- */
	/*  Embed                                       */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _buildEmbedHTML(config, options={}) {
		console.log( config );
		config.caption = false;
		config.cite = false;
		const embed = await super._buildEmbedHTML(config, options);
		if ( !embed ) {
			if ( this.type === "modification" ) return this._embedModification(config, options);
			else if ( this.type === "image" ) return this._embedModification(config, options);
		}
		return embed;
	}

	async _embedModification(config, options={}) {
		const container = document.createElement("div");
		
		container.innerHTML = `
			<div class="modification-header">
				<span style="font-family: SkyfallIcons">M</span> ${this.cost.label} ${this.modTypes.label}
			</div>
			<div class="modification-description">
				${this.description}
			</div>
		`;
		return container.children;
	}

}