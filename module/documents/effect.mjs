import { SYSTEM } from "../config/system.mjs";

export default class SkyfallEffect extends ActiveEffect {
	tooltip;
	/* -------------------------------------------- */
	/*  Getters                                     */
	/* -------------------------------------------- */
	get statusName() {
		if ( this.isGroup ) {
			let labels = [];
			for (const [key, value] of Object.entries( this.system.group ) ) {
				if ( !value ) continue;
				labels.push(SYSTEM.protectedGroup[key].label);
			}
			return `${this.name} (${labels.join(', ')})`;
		} else if ( this.isStack ) return `${this.name} ${this.stack}`
		else return this.name;
	}

	get statusGroupLabels() {
		if ( this.isGroup ) {
			let labels = [];
			for (const [key, value] of Object.entries( this.system.group ) ) {
				if ( !value ) continue;
				labels.push(SYSTEM.protectedGroup[key].label);
			}
			return labels;
		} else return null;
	}

	get statusId() {
		let id = this.id.replaceAll(0, '');
		return SYSTEM.conditions[id] ?? null;
	}
	get isGroup() {
		return ( 'group' in this.system )
	}

	get isStack() {
		return ( 'stack' in this.system )
	}
	get stack(){
		return this.system.stack ?? false;
	}
	set stack(value){
		if ( !this.isStack ) return console.warn("Effect is not stackable");
		return this.update({"system.stack": this.stack + value});
	}

	get cost(){
		if ( this.type != 'modification' ) return null;
		const cost = {value: 1, resource:'ep', label: ``};
		cost.label = `+${cost.value} `;
		cost.label += game.i18n.localize(`SKYFALL.ACTOR.RESOURCES.${cost.resource.toUpperCase()}ABBR`);
		return cost;
	}

	get modTypes(){
		if ( this.type != 'modification' ) return null;
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
		// console.log(`${this.documentName}.prepareData()`, this.id);
		super.prepareData();
	}

	/** @override */
	prepareBaseData() {
		// console.log(`${this.documentName}.prepareBaseData()`);
		
	}

	/** @override */
	prepareDerivedData() {
		// console.log(`${this.documentName}.prepareDerivedData()`);
		const actorData = this;
		const systemData = actorData.system;
		const flags = actorData.flags.skyfall || {};

		if ( this.isStack ) {
			console.log('PREPARE STACK DESCRIPTION');
			this.tooltip = this.description.replace(`<h3>${this.name}</h3>`, `<h3>${this.statusName}</h3>`);
		} else if ( this.isGroup ) {
			console.log('PREPARE GROUP DESCRIPTION');
			const labels = this.statusGroupLabels?.map(l => `<label>${game.i18n.localize(l)}</label>` ) ?? '';
			this.tooltip = this.description.replace(`<h3>${this.name}</h3>`, `<h3>${this.name}</h3><p>${labels}</p>`);
		} else {
			this.tooltip = this.description;
		}
	}
	
	getRollData(){
		const data = this;
		return data;
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
		console.log('fromStatusEffect', options);
		if ( typeof statusData === "string" ) statusData = CONFIG.statusEffects.find(e => e.id === statusData);
		if ( foundry.utils.getType(statusData) !== "Object" ) return;
		const createData = {
			...foundry.utils.deepClone(statusData),
			_id: statusData.id.padEnd(16,0),
			disabled: false,
			name: game.i18n.localize(statusData.name),
			statuses: [statusData.id, ...statusData.statuses ?? []],
		};
		this.migrateDataSafe(createData);
		this.cleanData(createData);
		return new this(createData, { keepId: true, ...options });
		return ActiveEffect.implementation._fromStatusEffect(statusId, effectData, options);
	}

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		let allowed = await super._preCreate(data, options, user);
		if ( allowed !== false ) allowed = this._stackEffect(data);
		console.log(this, allowed)
		if ( allowed !== false ) allowed = this._groupEffect(data);
		return allowed;
	}

	_stackEffect(data){
		if ( !this.isStack ) return true;
		console.log('isStack', data, this);
		// parent has status; TODO: When a AE has this in statuses;
		// if ( !(this.parent.statuses?.has( data.id )) ) return true;
		// status Exists
		const effect = this.parent.effects.find(ef => ef.id.startsWith( data.id ) );
		if ( !effect ) return true;
		effect.stack = 1;
		return false;
	}

	async _groupEffect(data){
		// is Group?
		console.log('isGroup', data, this);
		if ( !this.isGroup ) return true;
		// if ( !(this.parent.statuses?.has( data.statuses[0] )) ) return true;
		//.find(ef => ef.statuses.has( data.statuses[0] ) );
		const effect = this.parent?.effects.find(ef => ef.id.startsWith(data.id));
		console.log(effect);

		let content = '';
		for (const group of Object.values(SYSTEM.protectedGroup)) {
			let checked = effect?.system.group[group.id] ? 'checked' : '';
			content += `<div class="form-group "><div class="form-fields"><label for="${group.id}">${group.label}</label><input type="checkbox" name="${group.id}" ${checked}></div></div>`;
		}
		
		const groups = await Dialog.prompt({
			title: effect?.name ?? data.name,
			content: `<form><div style="columns:3;">` + content + `</div></form>`,
			callback: html => {
				let inputs = html[0].querySelectorAll('input');
				let group = {};
				for (const inp of inputs) {
					group[inp.name] = inp.checked;
				}
				return group;
			},
			options: {width: 300}
		});
		const statuses = [].concat( (effect?.statuses.toObject() ?? data.statuses ?? []) );
		for (const key in groups) {
			if ( !groups[key] ) continue;
			statuses.push( data.id + '-' + key );
		}
		this.updateSource({"system.group": groups, statuses: statuses});
		if ( !effect ) return true;
		effect.update({"system.group": groups, statuses: statuses});
		return false;
	}

	// /* -------------------------------------------- */

	/** @inheritDoc */
	async _onCreate(data, options, user) {
		return;
		await super._onCreate(data, options, user);
	}

	// /* -------------------------------------------- */

	/** @inheritdoc */
	async _preUpdate(data, options, userId) {
		return await super._preUpdate(data, options, userId);
	}

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
		console.log(embed);
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