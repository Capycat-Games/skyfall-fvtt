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
export default class SkyfallActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["active-effect-config", "skyfall"],
		
	};
	
	/** @override */
	static PARTS = {
		header: {template: "systems/skyfall/templates/v2/effect/header.hbs"},
		tags: {template: "templates/generic/tab-navigation.hbs"},
		details: {template: "systems/skyfall/templates/v2/effect/details.hbs"},
		duration: {template: "systems/skyfall/templates/v2/effect/duration.hbs"},
		changes: {template: "systems/skyfall/templates/v2/effect/changes.hbs"},
		footer: {template: "templates/generic/form-footer.hbs"}
	};

	/* ----------------------------------------- */
	
	#prepareTabs() {
		return this.constructor.TABS.reduce((tabs, tab) => {
			tab.active = this.tabGroups.sheet === tab.id;
			tab.cssClass = tab.active ? "active" : "";
			tabs[tab.id] = tab;
			return tabs;
		}, {});
	}

	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		const document = this.document;
		context.document = document;
		context.source = document._source;
		context.system = document.system;
		context.fields = document.schema.fields;
		context.rootId = this.id;
		context._selOpts = {};
		this.getDescriptors(context);
		this.#getSystemFields(context);
		return context;
	}
	/** @override */
	async _prepareContext2(options) {
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
