import { abilities } from "../config/creature.mjs";
import { SYSTEM } from "../config/system.mjs";
import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { SkyfallSheetMixin } from "./base.mjs";
const { ActorSheetV2 } = foundry.applications.sheets;

export default class NPCSheetSkyfall extends SkyfallSheetMixin(ActorSheetV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		window:{
			resizable: true,
		},
		classes: ["skyfall", "actor", "npc"],
		position: { width: 500, height: 660},
		actions: {
			someAction: NPCSheetSkyfall.#someAction,
		}
	};

	/** @override */
	static PARTS = {
		tabs: {template: "templates/generic/tab-navigation.hbs"},
		statblock: {
			template: "systems/skyfall/templates/v2/actor/statblock.hbs",
			templates: [
				"systems/skyfall/templates/v2/actor/statblock-abilities.hbs",
			]
		},
		effects: {
			template: "systems/skyfall/templates/v2/shared/effects.hbs",
			// scrollable: [".actor-effects"]
		},
	}

	/** @override */
	static TABS = {
		statblock: {id: "statblock", group: "actor", label: "SKYFALL.TAB.STATBLOCK", cssClass: 'active'},
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
		console.log("_getHeaderControls", controls, this);
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
		console.log(this);
		if (this.document.limited) return;
		options.parts = ["tabs", "statblock", "effects"];
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
		// this._prepareItems(context);
		this._prepareAbilities(context);
		
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
		
		context._skills = Object.values(context.system.skills).filter(i => i.value > 0);
		const damageTaken = this.document.system.modifiers.damage.taken;
		const conditionImunity = this.document.system.modifiers.condition.imune;
		context.irv = {};
		context.irv.vul = [];
		context.irv.res = [];
		context.irv.imu = [];
		conditionImunity.forEach((k) => {
			context.irv.imu.push({
				id: k,
				label: SYSTEM.conditions[k].name,
				type: 'condition',
			});
		});
		Object.entries(damageTaken).forEach( ([k,v]) => {
			if ( v == "nor" ) return;
			context.irv[v].push({
				id: k,
				label: SYSTEM.DESCRIPTOR.DAMAGE[k].label,
				type: 'descriptor',
			});
		});
	}
	_prepareAbilities(context){
		context.abilities = {};
		["passive","reaction","action","bonus","free","maction"].reduce((acc, key) => {
			let cat = { id: key,
				icon: SYSTEM.icons[`sf${key}`],
				label: game.i18n.localize(`SKYFALL.ITEM.ACTIVATIONS.${key.toUpperCase()}`),
				list: this.document.items.filter( i => i.type=='ability' && i.system.activation.type == key )
			}
			acc[key] = cat;
			return acc;
		}, context.abilities);
	}
	
	static #someAction(){

	}
}