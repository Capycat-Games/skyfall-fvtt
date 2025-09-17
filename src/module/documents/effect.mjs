const TextEditor = foundry.applications.ux.TextEditor.implementation;
const {renderTemplate} = foundry.applications.handlebars;
export default class SkyfallEffect extends ActiveEffect {
	tooltip;
	/* -------------------------------------------- */
	/*  Getters                                     */
	/* -------------------------------------------- */

	/**
	 * Describe whether the ActiveEffect has a temporary duration based on combat turns or rounds.
	 * @type {boolean}
	 */
	get isTemporary() {
		const duration = this.duration.seconds ?? (this.duration.rounds || this.duration.turns) ?? 0;
		const special = this.system.specialDuration;
		return special || (duration > 0) || (this.statuses.size > 0);
	}
	
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
		return ( 'group' in this.system && this.system.group )
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
		const cost = this.system.cost; // {value: 1, resource:'ep', label: ``};
		const schema = this.system.schema;
		
		// if ( !Number(cost.value) ) cost.label = ``;
		if ( this.system.apply.type.includes('amplify') ) cost.label = ``;
		else {
			cost.label = `+${cost.value} `;
			const resources = schema.fields.cost.fields.resource.choices;
			if (this.parent?.type == "guild-ability") {
				cost.label += game.i18n.localize(`${resources[cost.resource].label}`);
			} else {
				cost.label += game.i18n.localize(`${resources[cost.resource].label}ABBR`);
			}
		}
		return cost;
	}

	get modTypes(){
		if ( this.type != 'modification' ) return null;
		const { type, amplifyThreshold } = this.system.apply;
		let labels = [];
		for (const t of type) {
			const label = game.i18n.localize(`SKYFALL2.MODIFICATION.TYPE.${t.titleCase()}`);
			if ( t == 'amplify' ) labels.push( `${label} ${amplifyThreshold}+` );
			else labels.push(`[${label}]`);
		}
		return {label: `${labels.join(' & ')}`.toUpperCase()};
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @override */
	prepareData() {
		super.prepareData();
	}

	/** @override */
	prepareBaseData() {
		
	}

	/** @override */
	prepareDerivedData() {
		const actorData = this;
		const systemData = actorData.system;
		const flags = actorData.flags.skyfall || {};

		if ( this.isStack ) {
			this.tooltip = this.description.replace(`<h3>${this.name}</h3>`, `<h3>${this.statusName}</h3>`);
		} else if ( this.isGroup ) {
			const labels = this.statusGroupLabels?.map(l => `<label>${game.i18n.localize(l)}</label>` ) ?? '';
			this.tooltip = this.description.replace(`<h3>${this.name}</h3>`, `<h3>${this.name}</h3><p>${labels}</p>`);
		} else {
			this.tooltip = this.description;
		}
		// this.tooltip = `<div>${this.tooltip}</div>`;
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
		if ( allowed !== false ) allowed = this._groupEffect(data);
		return allowed;
	}

	_stackEffect(data){
		if ( !this.isStack ) return true;
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
		if ( !this.isGroup ) return true;
		// if ( !(this.parent.statuses?.has( data.statuses[0] )) ) return true;
		//.find(ef => ef.statuses.has( data.statuses[0] ) );
		const effect = this.parent?.effects.find(ef => ef.id.startsWith(data.id) || ef.id == data.id );
		const id = data.id ?? data._id.replaceAll('0','');

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
			statuses.push( id + '-' + key );
		}
		
		this.updateSource({"system.group": groups, statuses: statuses});
		if ( !effect ) return true;
		effect.update({"system.group": groups, statuses: statuses});
		return false;
	}

	// /* -------------------------------------------- */

	/** @inheritDoc */
	async _onCreate(data, options, user) {
		await super._onCreate(data, options, user);
	}

	// /* -------------------------------------------- */

	/** @inheritdoc */
	async _preUpdate(changed, options, user) {
		return await super._preUpdate(changed, options, user);
	}

	// /* -------------------------------------------- */

	// /** @inheritdoc */
	// _onUpdate(data, options, userId) {
	// 	return super._onUpdate(data, options, userId);
	// }

	/* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */
	
	apply(actor, change) {
		let allowed = this.applyRollData( change );
		if ( !allowed ) return;
		return super.apply( actor, change );
	}
	
	applyRollData( change ){
		const parent = this.parent;
		const granparent = this.parent ? this.parent.parent : null;
		if ( change.key.startsWith('@') ) {
			change.key = change.key.replace('@', 'system.');
		}

		if ( change.key.startsWith('_') ) {
			change.key = change.key.replace('_', 'system._');
		}
		if ( !granparent ) return true;
		if ( change.key.startsWith('?') ) {
			const data = change.key.replace('?','').split(':').map( i => i.trim());
			change.condition = data[0];
			change.key = data[1];
			change.condition = Roll.replaceFormulaData( change.condition, parent.getRollData() );
		}
		change.value = Roll.replaceFormulaData( change.value, parent.getRollData());
		if ( granparent.documentName == "Actor" ) {
			change.value = Roll.replaceFormulaData( change.value, granparent.getRollData());
			if ( change.condition ) {
				change.condition = Roll.replaceFormulaData( change.condition, granparent.getRollData() );
			}
		}
		
		if ( change.condition && Roll.safeEval(change.condition) === false ) return false;
		else if ( change.condition ) { 
			if ( change.key.startsWith('_') ) {
				change.key = change.key.replace('_', 'system._');
			}
			if ( change.key.startsWith('@') ) {
				change.key = change.key.replace('@', 'system.');
			}
		}
		try {
			const roll = new Roll(change.value);
			if ( roll.isDeterministic ) change.value = roll.evaluateSync().total;
			return true;
		} catch (error) {
			return true;
		}
	}

	/* -------------------------------------------- */
	/*  Embed                                       */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _buildEmbedHTML(config, options={}) {
		config.caption = false;
		config.cite = false;
		const embed = await super._buildEmbedHTML(config, options);
		
		if ( !embed ) {
			if ( this.type === "modification" ) return this._embedModification(config, options);
			// else if ( this.type === "base" ) return this._embedBase(config, options);
		}
		return embed;
	}

	async _embedModification(config, options={}) {
		const container = document.createElement("div");
		const description = await TextEditor.enrichHTML(this.description, {
			async: true, relativeTo: this
		});
		container.innerHTML = `
			<div class="modification-header flexrow">
				<div class="modification-name">
					<span style="font-family: SkyfallIcons">M</span> ${this.name} ${this.cost.label} ${this.modTypes.label}
				</div>
			</div>
			<div class="modification-description">
				${description}
			</div>
		`;
		if ( config.controls ) {
			const applyMulti = this.system.cost.multiple;
			const controls = document.createElement('div');
			controls.classList.add('controls','flexrow');
			const input = document.createElement('input');
			input.type = applyMulti ? 'number' : 'checkbox';
			input.name = `effects.${this.id}.apply`;
			input.setAttribute('value', (applyMulti ? 0 : 1));
			if ( applyMulti ) {
				const button = document.createElement('button');
				button.type = 'button';
				button.dataset.action = 'applyVary';
				button.dataset.modificationId = this.id;

				button.dataset.vary = '-';
				button.innerHTML = SYSTEM.icons.minus;
				controls.append(button);
				controls.append(input);
				
				const button2 = button.cloneNode();
				button2.dataset.vary = '+';
				button2.innerHTML = SYSTEM.icons.create;
				controls.append(button2);

			} else {
				input.dataset.action = 'applyToggle';
				input.dataset.modificationId = this.id;
				controls.append(input);
			}
			container.querySelector('.modification-header').append(controls);
		}
		return container.children;
	}

	async richTooltip() {
		// DURATION?
		// INHERIT PARENT DESCRIPTORS?
		return await renderTemplate(
			"systems/skyfall/templates/v2/apps/effect-tooltip.hbs", {
				effect: this,
				description: await TextEditor.enrichHTML(this.description, {
					async: true, relativeTo: this
				}),
				cssClasses: ["skyfall", "effect-tooltip"]
			}
		);
		
		// {} ;
	}


}