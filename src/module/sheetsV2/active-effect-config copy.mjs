const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api;
const {ACTIVE_EFFECT_MODES} = CONST;
/**
 * @import {ApplicationClickAction, ApplicationFormSubmission, ApplicationTab} from "../_types.mjs";
 */

/**
 * CLASS TAKEN FROM v13 prototype release, TODO track updates
 * The Application responsible for configuring a single ActiveEffect document within a parent Actor or Item.
 * @extends DocumentSheetV2
 * @mixes HandlebarsApplication
 * @alias ActiveEffectConfig
 */
export default class ActiveEffectConfig extends HandlebarsApplicationMixin(DocumentSheetV2) {

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["active-effect-config","skyfall"],
		position: {width: 560},
		window: {
			contentClasses: ["standard-form"],
			icon: "fa-solid fa-person-rays"
		},
		form: {
			handler: ActiveEffectConfig.#onSubmitDocumentForm,
			submitOnChange: true,
			closeOnSubmit: false,
		},
		actions: {
			addChange: ActiveEffectConfig.#onAddChange,
			deleteChange: ActiveEffectConfig.#onDeleteChange
		}
	};

	/** @override */
	static PARTS = {
		header: {template: "systems/skyfall/templates/v2/effect/header.hbs"},
		tags: {template: "templates/generic/tab-navigation.hbs"},
		details: {template: "systems/skyfall/templates/v2/effect/details.hbs"},
		duration: {template: "systems/skyfall/templates/v2/effect/duration.hbs"},
		changes: {template: "systems/skyfall/templates/v2/effect/changes.hbs"},
		// footer: {template: "templates/generic/form-footer.hbs"}
	};

	/**
	 * @type {Omit<ApplicationTab, "active" | "cssClass">[]}
	 */
	static TABS = [
		{id: "details", group: "sheet", icon: "fa-solid fa-book", label: "EFFECT.TABS.Details"},
		{id: "duration", group: "sheet", icon: "fa-solid fa-clock", label: "EFFECT.TABS.Duration"},
		{id: "changes", group: "sheet", icon: "fa-solid fa-cogs", label: "EFFECT.TABS.Changes"}
	];

	/**
	 * The default priorities of the core change modes
	 * @type {Record<number, number>}
	 */
	static DEFAULT_PRIORITIES = Object.values(ACTIVE_EFFECT_MODES).reduce((priorities, mode) => {
		priorities[mode] = mode * 10;
		return priorities;
	}, {});

	/* ----------------------------------------- */

	/** @override */
	tabGroups = {sheet: "details"};

	/* ----------------------------------------- */

	/** @override */
	async _prepareContext(options) {
		const document = this.document;
		const context = {
			document,
			source: document._source,
			system: document.system,
			fields: document.schema.fields,
			tabs: this.#prepareTabs(),
			rootId: this.id,
			buttons: [{type: "submit", icon: "fa-solid fa-save", label: "EFFECT.Submit"}]
		};
		context._selOpts = {};
		this.getDescriptors(context);
		this.#getSystemFields(context);
		return context;
	}

	/* ----------------------------------------- */

	/** @inheritDoc */
	async _preparePartContext(partId, context) {
		const partContext = await super._preparePartContext(partId, context);
		if ( partId in partContext.tabs ) partContext.tab = partContext.tabs[partId];
		const document = this.document;
		switch ( partId ) {
			case "details":
				partContext.isActorEffect = document.parent.documentName === "Actor";
				partContext.isItemEffect = document.parent.documentName === "Item";
				partContext.legacyTransfer = CONFIG.ActiveEffect.legacyTransferral
					? {label: game.i18n.localize("EFFECT.TransferLegacy"), hint: game.i18n.localize("EFFECT.TransferHintLegacy")}
					: null;
				partContext.statuses = CONFIG.statusEffects.map(s => ({value: s.id, label: game.i18n.localize(s.name)}));
				break;
			case "changes":
				partContext.modes = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((modes, [key, value]) => {
					modes[value] = game.i18n.localize(`EFFECT.MODE_${key}`);
					return modes;
				}, {});
				partContext.priorities = ActiveEffectConfig.DEFAULT_PRIORITIES;
		}
		return partContext;
	}

	/* ----------------------------------------- */

	#prepareTabs() {
		return this.constructor.TABS.reduce((tabs, tab) => {
			tab.active = this.tabGroups.sheet === tab.id;
			tab.cssClass = tab.active ? "active" : "";
			tabs[tab.id] = tab;
			return tabs;
		}, {});
	}

	/* ----------------------------------------- */

	getDescriptors(context, types = []) {
		if ( this.document.type != 'modification' ) return;
		context.descriptors = context.document.system.apply.descriptors.reduce((acc, key) => {
			acc[key] = true;
			return acc;
		}, {});
		context.descriptors = {};
		context._selOpts['descriptors'] = {};
		
		for (const [category, descriptors] of Object.entries(SYSTEM.DESCRIPTOR)) {
			if ( types.length && !types.includes(category) ) continue;
			for (const [id, desc] of Object.entries(descriptors)) {
				context._selOpts['descriptors'][category.titleCase()] ??= {};
				context._selOpts['descriptors'][category.titleCase()][desc.id] = {
					...desc, 
					value: (context.document.system.apply.descriptors.includes(desc.id))
				}
			}
			foundry.utils.mergeObject(context.descriptors, context._selOpts['descriptors'][category.titleCase()]);
		}
		for (const desc of context.document.system.apply.descriptors) {
			if ( desc in context.descriptors ) continue;
			context._selOpts['descriptors']["Origin"][desc] = {
				id: desc, hint: "", type: ["origin"], label: desc.toUpperCase(), value: true
			}
		}
	}

	#getSystemFields(context) {
		// if ( this.document.type != 'modification' ) return;
		let system = this.document.system.toObject();
		const schema = this.document.system.schema;
		system = foundry.utils.flattenObject(system);
		
		for (const path of Object.keys(system)) {
			system[path] = schema.getField(path);
		}
		context.systemFields = foundry.utils.expandObject(system);
	}

	/* -------------------------------------------- */
	/*  Event Listeners and Handlers                */
	/* -------------------------------------------- */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		super._onChangeForm(formConfig, event);
		// Update the priority placeholder to match the mode selection
		if ( event.target instanceof HTMLSelectElement && event.target.name.endsWith(".mode") ) {
			const modeSelect = event.target;
			const selector = `input[name="${modeSelect.name.replace(".mode", ".priority")}"]`;
			const priorityInput = modeSelect.closest("li").querySelector(selector);
			priorityInput.placeholder = ActiveEffectConfig.DEFAULT_PRIORITIES[modeSelect.value] ?? "";
		}
	}

	/* ----------------------------------------- */

	/**
	 * Add a new change to the effect's changes array.
	 * @this {ActiveEffectConfig}
	 * @type {ApplicationClickAction}
	 */
	static async #onAddChange() {
		const submitData = this._processFormData(null, this.element, new FormDataExtended(this.element));
		submitData.changes ??= [];
		const changes = Object.values(submitData.changes);
		changes.push({});
		return this.submit({updateData: {changes}});
	}

	/* ----------------------------------------- */

	/**
	 * Delete a change from the effect's changes array.
	 * @this {ActiveEffectConfig}
	 * @type {ApplicationClickAction}
	 */
	static async #onDeleteChange(event) {
		const submitData = this._processFormData(null, this.element, new FormDataExtended(this.element));
		submitData.changes ??= [];
		const changes = Object.values(submitData.changes);
		const row = event.target.closest("li");
		const index = Number(row.dataset.index) || 0;
		changes.splice(index, 1);
		return this.submit({updateData: {changes}});
	}

	/* ----------------------------------------- */

	static async #onSubmitDocumentForm(event, form, formData) {
		const submitData = this._prepareSubmitData(event, form, formData);
		await this._processSubmitData(event, form, submitData);
	}

	_processFormData(event, form, formData) {
		const fdObject = formData.object;
		if ( fdObject['system.apply.itemType'] ) {
			formData.object['system.apply.itemType'] = fdObject['system.apply.itemType'].filter(Boolean);
		}
		if ( fdObject['system.apply.type'] ) {
			formData.object['system.apply.type'] = fdObject['system.apply.type'].filter(Boolean);
		}
		if ( fdObject['system.apply.descriptors'] ) {
			fdObject['system.apply.descriptors'] = fdObject['system.apply.descriptors'].filter(Boolean);
		}
		if ( fdObject['_descriptor'] ) {
			fdObject['system.apply.descriptors'] = [
				fdObject['_descriptor'],
				...fdObject['system.apply.descriptors']];
		}
		return foundry.utils.expandObject(formData.object);
	}
}
