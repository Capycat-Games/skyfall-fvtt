import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { SkyfallSheetMixin } from "./base.mjs";

export default class SkyfallItemSheetV2 extends SkyfallSheetMixin(foundry.applications.sheets.ItemSheetV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["skyfall", "item"],
		position: {width: 520, height: "auto"},
		actions: {
			someAction: SkyfallItemSheetV2.#someAction,
		}
	};

	/** @override */
	static PARTS = {
		header: {template: "systems/skyfall/templates/v2/item/header.hbs"},
		tabs: {template: "templates/generic/tab-navigation.hbs"},
		description: {template: "systems/skyfall/templates/v2/item/description.hbs", scrollable: [""]},
		// details: {template: "systems/artichron/templates/partials/item-details.hbs", scrollable: [""]},
		// traits: {template: "templates/generic/tab-navigation.hbs"},
		// heritage: {template: "templates/generic/tab-navigation.hbs"},
		// abilities: {template: "templates/generic/tab-navigation.hbs"},
		// feats: {template: "templates/generic/tab-navigation.hbs"},
		// features: {template: "systems/skyfall/templates/item/parts/features.hbs"},
		debug: {template: "systems/skyfall/templates/v2/shared/debug.hbs"},
		effects: {template: "systems/skyfall/templates/v2/shared/effects.hbs",scrollable: [""]}
	};

	/** @override */
	static TABS = {
		description: {id: "description", group: "primary", label: "SKYFALL.DESCRIPTION", cssClass: 'active'},
		// traits: {id: "traits", group: "primary", label: "SKYFALL.ITEM.LEGACY.TRAITS"},
		// details: {id: "details", group: "primary", label: "SKYFALL.ITEM.Details"},
		debug: {id: "debug", group: "primary", label: "DEBUG"},
		effects: {id: "effects", group: "primary", label: "TYPES.ActiveEffect.BasePL"}
	};

	/** @override */
	tabGroups = {
		primary: "description"
	};

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		console.log(options);
		console.log(this);
		if (this.document.limited) return;
		
		switch (this.document.type) {
			case 'loot':
			case 'weapon':
			case 'armor':
			case 'clothing':
			case 'consumable':
			case 'equipment':
				options.parts = ["header","tabs","description","traits","debug","effects"];
				break;
			case 'legacy':
				options.parts = ["header","tabs","traits","features","heritage","feats","effects"];
			case 'background':
				options.parts = ["header","tabs","description","effects"];
			case 'class':
			case 'path':
				options.parts = ["header","tabs","description","features","feats","effects"];
				break;
			case 'feature':
			case 'curse':
			case 'feat':
				options.parts = ["header","tabs","description","abilities","effects"];
				break;
			case 'ability':
			case 'spell':
			case 'sigil':
				options.parts = ["card","tabs","ability","effects"];
				options.parts.push('foo')
				break;
		}
	}

	/** @override */
	async _preparePartContext(partId, context) {
		const doc = this.document;
		switch ( partId ) {
			case "description":
				// context.tab = context.tabs.behaviors;
				// break;
			case "debug":
				// context.tab = context.tabs.behaviors;
				// break;
			case "effects":
				// context.tab = context.tabs.behaviors;
				// break;
			default:
				if ( context.tabs[partId] ){
					context.tab = context.tabs[partId];
				}
		}
		return context;
	}

	/** @override */
	async _prepareContext(options) {
		const doc = this.document;
		const src = doc.toObject();
		const rollData = doc.getRollData();

		const enrichmentOptions = {
			secrets: doc.isOwner, async: true, relativeTo: doc, rollData: rollData
		}

		const context = {
			document: doc,
			item: doc,
			user: game.user,
			system: doc.system,
			source: src.system,
			schema: this._getDataFields(),
			SYSTEM: SYSTEM,
			effects: prepareActiveEffectCategories( this.item.effects.filter(ef=> ef.type == 'base') ),
			modifications: prepareActiveEffectCategories( this.item.effects.filter(ef=> ef.type == 'modification'), 'modification' ),
			enriched: {
				description: await TextEditor.enrichHTML(doc.system.description.value, enrichmentOptions),
			},
			tabs: this._getTabs(),
			isEditMode: this.isEditMode,
			isPlayMode: this.isPlayMode,
			isEditable: this.isEditable,
			isEditing: this.isEditing,
			_selOpts: {},
		};
		this.getDescriptors(context);
		console.log(context);
		return context;
	}

	/* ---------------------------------------- */

	_getDataFields(){
		const doc = this.document;
		const schema = doc.system.schema;
		const dataFields = foundry.utils.flattenObject(doc.system.toObject());
		
		for (const fieldPath of Object.keys(dataFields)) {
			dataFields[fieldPath] = schema.getField(fieldPath);
		}
		return foundry.utils.expandObject(dataFields);
	}

	async getDescriptors(context, types = []) {
		context.descriptors = context.system.descriptors.reduce((acc, key) => {
			acc[key] = true;
			return acc;
		}, {});
		
		context.descriptors = {};
		context._selOpts['descriptors'] = {};
		
		for (const [category, descriptors] of Object.entries(SYSTEM.DESCRIPTOR)) {
			console.log( category, descriptors );
			if ( types.length && !types.includes(category) ) continue;
			for (const [id, desc] of Object.entries(descriptors)) {
				context._selOpts['descriptors'][category] ??= {};
				context._selOpts['descriptors'][category][desc.id] = {
					...desc, 
					value: (context.system.descriptors.includes(desc.id))
				}
			}
			foundry.utils.mergeObject(context.descriptors, context._selOpts['descriptors'][category]);
		}
		for (const desc of context.system.descriptors) {
			if ( desc in context.descriptors ) continue;
			context._selOpts['descriptors']["ORIGIN"][desc] = {
				id: desc, hint: "", type: ["origin"], label: desc.toUpperCase(), value: true
			}
		}

		return;
		const _descriptors = [ ...context.system.descriptors , ...Object.keys(SYSTEM.DESCRIPTORS) ];
		context.descriptors = _descriptors.reduce((acc, key) => {
			if ( type && !SYSTEM.DESCRIPTORS[key]?.type.includes(type) ) return acc;
			acc[key] = {
				value: (context.system.descriptors.includes(key)),
				...SYSTEM.DESCRIPTORS[key] ?? {
					id: key, hint: "", type: "origin", label: key.toUpperCase(),
				}
			}
			return acc;
		}, {});
		
		context._selOpts['descriptors'] = _descriptors.reduce((acc, key) => {
			let desc = SYSTEM.DESCRIPTORS[key] ?? {
				id: key, hint: "", type: ["origin"], label: key.toUpperCase(),
			}
			if ( type && !desc.type.some( t=> type.includes(t)) ) return acc;
			desc.value = (context.system.descriptors.includes(desc.id));
			desc.type.map( (t) => {
				acc[t.toUpperCase()] ??= {};
				acc[t.toUpperCase()][desc.id] = desc;
			});
			return acc;
		}, {});
		return;
	}

	/* ---------------------------------------- */
	/*              EVENT HANDLERS              */
	/* ---------------------------------------- */

	/**
	 * Handle click events to remove a particular damage formula.
	 * @param {Event} event             The initiating click event.
	 * @param {HTMLElement} target      The current target of the event listener.
	 */
	static #someAction(event, target) {
		console.log('someAction', this.document);
	}
}