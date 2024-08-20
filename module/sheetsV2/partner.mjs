import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { SkyfallSheetMixin } from "./base.mjs";
const { ActorSheetV2 } = foundry.applications.sheets;

export default class PartnerSheetSkyfall extends SkyfallSheetMixin(ActorSheetV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		window:{
			resizable: true,
		},
		classes: ["skyfall", "actor", "npc"],
		position: { width: 500, height: 660},
		actions: {
			itemToChat: PartnerSheetSkyfall.#itemToChat,
		}
	};

	/** @override */
	static PARTS = {
		tabs: {template: "templates/generic/tab-navigation.hbs"},
		statblock: {
			template: "systems/skyfall/templates/v2/actor/statblock-partner.hbs",
			templates: [
				"systems/skyfall/templates/v2/actor/statblock-abilities.hbs",
			]
		},
		inventory: {
			template: "systems/skyfall/templates/v2/actor/inventory.hbs",
			scrollable: [".actor-inventory"]
		},
		effects: {
			template: "systems/skyfall/templates/v2/shared/effects.hbs",
			// scrollable: [".actor-effects"]
		},
	}

	/** @override */
	static TABS = {
		statblock: {id: "statblock", group: "actor", label: "SKYFALL.TAB.STATBLOCK", cssClass: 'active'},
		inventory: {id: "inventory", group: "actor", label: "SKYFALL.TAB.INVENTORY" },
		effects: {id: "effects", group: "actor", label: "SKYFALL.TAB.EFFECTS" },
	};

	/** @override */
	tabGroups = {
		actor: "statblock"
	};
	
	/**
	 * Configure the array of header control menu options
	 * @returns {ApplicationHeaderControlsEntry[]}
	 * @protected
	 */
	/** @override */
	_getHeaderControls() {
		const controls = [].concat(this.options.window.controls);
		// Portrait image
		const img = this.actor.img;
		if ( img === CONST.DEFAULT_TOKEN ) controls.findSplice(c => c.action === "showPortraitArtwork");

		// Token image
		const pt = this.actor.prototypeToken;
		const tex = pt.texture.src;
		if ( pt.randomImg || [null, undefined, CONST.DEFAULT_TOKEN].includes(tex) ) {
			controls.findSplice(c => c.action === "showTokenArtwork");
		}
		return controls;
	}

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		if (this.document.limited) return;
		this.options.classes.push( this.document.type );
		options.parts = ["tabs", "statblock", "inventory", "effects"];
	}
	
	/** @override */
	async _preparePartContext(partId, context) {
		const doc = this.document;
		
		switch ( partId ) {
			case "tabs":
			case "actions":
			case "effects":
				// context.tab = context.tabs.behaviors; ?
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
			actor: doc,
			user: game.user,
			system: doc.system,
			source: src.system,
			schema: this._getDataFields(),
			items: {},
			SYSTEM: SYSTEM,
			effects: prepareActiveEffectCategories( doc.effects.filter(ef=> ef.type == 'base') ),
			modifications: prepareActiveEffectCategories( doc.effects.filter(ef=> ef.type == 'modification'), 'modification' ),
			enriched: {
				// description: await TextEditor.enrichHTML(doc.system.description.value, enrichmentOptions),
				
			},
			embeds: {},
			tabs: this._getTabs(),
			isEditMode: this.isEditMode,
			isPlayMode: this.isPlayMode,
			isEditable: this.isEditable,
			isEditing: true, //this.isEditing,
			rolling: this.rolling,
			_selOpts: {},
			_selectOptions: {},
			_app: {
				fields: foundry.applications.fields,
				element: foundry.applications.elements
			}
		};
		
		// Prepare data
		this._prepareSystemData(context);
		// // 
		this._prepareItems(context);
		this._prepareFeatures(context);
		
		// if ( context.items.abilities ) {
		// 	context.enriched.debug = await TextEditor.enrichHTML(`<div>@Embed[${context.items.abilities[0].uuid}]{TESTE}</div>`, enrichmentOptions);
		// }
		context.statusEffects = CONFIG.statusEffects.reduce((acc, ef)=>{
			const statusData = this.actor.effects.find(e => e.statuses.has(ef.id) );
			ef.disabled = statusData?.disabled ?? true;
			acc.push(ef);
			return acc;
		}, []);
		console.log(context);
		return context;
	}

	_prepareSystemData(context){
		// SKILLS
		const profIcons = [
			SYSTEM.icons.square,
			SYSTEM.icons.check,
			SYSTEM.icons.checkdouble,
		];
		for (let [key, skill] of Object.entries(context.system.skills)) {
			skill.id = key;
			skill.label = SYSTEM.skills[key]?.label ?? skill.label ?? "SKILL";
			skill.icon = profIcons[skill.value];
			skill.type = SYSTEM.skills[key]?.type ?? 'apti' ?? 'custom';
		}
		
		context._skills = Object.values(context.system.skills).filter(i => i.value > 0);

		context.system.hc = Array.fromRange( context.system.resources.hc.max, 1 );
	}
	
	_prepareItems(context){
		const items = {
			abilities: [],
			actions: [],
			spells: [],
			inventory: {},
			sigils: [],
			features: [],
			class: [],
			path: [],
			attack: [],
			progression: SYSTEM.characterProgression
		}
		const inventory = ['weapon','armor','equipment','clothing','loot','consumable'];
		const progression = ['legacy','curse','background'];
		const classPaths = ['class','path'];
		for (const item of this.document.items ) {
			const isAttack = item.getFlag('skyfall','attack');
			if ( isAttack ) {
				items.attack.push(item);
				continue;
			}
			if ( inventory.includes(item.type) ) {
				if ( this.inventory == 'category' ) {
					items.inventory[item.type] ??= [];
					items.inventory[item.type].push(item);
				} else {
					items.inventory.category ??= [];
					items.inventory.category.push(item);
				}
			}
			if ( ['feature','feat'].includes(item.type) ) items.features.push(item);
			if ( item.type == 'ability' ) items.abilities.push(item);
			if ( item.type == 'spell' ) items.spells.push(item);
			if ( item.type == 'sigil' ) items.sigils.push(item);
			if ( progression.includes(item.type) ) items[item.type] = item;
			if ( classPaths.includes(item.type) ) items[item.type].push(item);
		}
		
		context.items = items;
	}

	async _prepareFeatures(context){
		context.features = this.document.items.filter( i => i.type=='feature' );
	}
	
	/**
	 * Handle click events to remove a particular damage formula.
	 * @param {Event} event             The initiating click event.
	 * @param {HTMLElement} target      The current target of the event listener.
	 */
	static #itemToChat(event, target) {
		const itemId = target.closest("[data-entry-id]").dataset.entryId;
		const item = this.document.items.get(itemId);
		if ( !item ) return;
		item.toMessage();
	}
}