import { SYSTEM } from "../config/system.mjs";
import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { SkyfallSheetMixin } from "./base.mjs";
const { ActorSheetV2 } = foundry.applications.sheets;

export default class CharacterSheetSkyfall extends SkyfallSheetMixin(ActorSheetV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		window:{
			resizable: true,
		},
		classes: ["skyfall", "actor", "character"],
		position: { width: 800, height: 660},
		actions: {
			inventoryDisplay: CharacterSheetSkyfall.#inventoryDisplay,
			itemToChat: CharacterSheetSkyfall.#itemToChat,
		}
	};

	/** @override */
	static PARTS = {
		aside: {template: "systems/skyfall/templates/v2/actor/aside.hbs" },
		tabs: {template: "templates/generic/tab-navigation.hbs"},
		actions: {
			template: "systems/skyfall/templates/v2/actor/actions.hbs",
			templates: [
				"systems/skyfall/templates/v2/actor/actions-ability-scores.hbs",
				"systems/skyfall/templates/v2/actor/actions-abilities.hbs",
				"systems/skyfall/templates/v2/actor/actions-skills.hbs",
			]
		},
		features: {
			template: "systems/skyfall/templates/v2/actor/features.hbs",
			templates: [
				"systems/skyfall/templates/v2/actor/features-progression.hbs",
			]
		},
		abilities: {
			template: "systems/skyfall/templates/v2/actor/abilities.hbs",
			templates: [
				"systems/skyfall/templates/v2/item/ability-card.hbs",
			],
			scrollable: [".actor-abilities"]
		},
		spells: {
			template: "systems/skyfall/templates/v2/actor/spells.hbs",
			scrollable: [".actor-spells"]
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
		actions: {id: "actions", group: "actor", label: "SKYFALL.TAB.ACTIONS", cssClass: 'active'},
		features: {id: "features", group: "actor", label: "SKYFALL.TAB.FEATURES" },
		abilities: {id: "abilities", group: "actor", label: "SKYFALL.TAB.ABILITIES" },
		spells: {id: "spells", group: "actor", label: "SKYFALL.TAB.SPELLS" },
		inventory: {id: "inventory", group: "actor", label: "SKYFALL.TAB.INVENTORY" },
		effects: {id: "effects", group: "actor", label: "SKYFALL.TAB.EFFECTS" },
	};

	/** @override */
	tabGroups = {
		actor: "actions"
	};

	// rolling = null;
	filters = {
		actions: { 
			melee: {
				active: true,
				icon: SYSTEM.icons.sfmelee,
				label: "SKYFALL2.ATTACK.Melee",
			},
			ranged: {
				active: true,
				icon: SYSTEM.icons.sfranged,
				label:"SKYFALL2.ATTACK.Ranged"
			},
			action: {
				active: true,
				icon: SYSTEM.icons.sfaction,
				label:"SKYFALL.ITEM.ACTIVATIONS.ACTION"
			},
			bonus: {
				active: true,
				icon: SYSTEM.icons.sfbonus,
				label:"SKYFALL.ITEM.ACTIVATIONS.BONUS"
			},
			reaction: {
				active: true,
				icon: SYSTEM.icons.sfreaction,
				label:"SKYFALL.ITEM.ACTIVATIONS.REACTION"
			},
			free: {
				active: true,
				icon: SYSTEM.icons.sffree,
				label:"SKYFALL.ITEM.ACTIVATIONS.FREE"
			},
		}
	};
	inventory = 'default';

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		if (this.document.limited) return;
		options.parts = ["aside", "tabs", "actions", "features", "abilities", "spells", "inventory", "effects"];
	}
	
	/** @override */
	async _preparePartContext(partId, context) {
		const doc = this.document;
		
		switch ( partId ) {
			case "aside":
				
			case "tabs":
			case "actions":
			case "features":
			case "abilities":
			case "spells":
			case "inventory":
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
			filters: this.filters,
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
			isEditing: this.isEditing,
			rolling: this.rolling,
			inventory: this.inventory,
			_selOpts: {},
			_selectOptions: {},
			_app: {
				fields: foundry.applications.fields,
				element: foundry.applications.elements
			}
		};
		
		// _prepareHeaderData 
		// Prepare data
		this._prepareSystemData(context);
		// 
		this._prepareItems(context);
		if ( context.items.abilities ) {
			// context.enriched.debug = await TextEditor.enrichHTML(`<div>@Embed[${context.items.abilities[0].uuid}]{TESTE}</div>`, enrichmentOptions);
		}
		this._prepareFilters(context);
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
		
		// SORT SKILLS
		let coreSkill = Object.values(context.system.skills).filter((p)=> !p.custom);
		let aptitudeSkills = Object.values(context.system.skills).filter((p)=> p.custom);
		context.skills = [...coreSkill.slice(0,2), ...aptitudeSkills, ...coreSkill.slice(2)];
		
		context.system.initiative = context.system.abilities.dex.value;
		// MOVEMENT
		context.movement = {};
		for (let [key, movement] of Object.entries(context.system.movement)) {
			if ( movement == 0 ) continue;
			if ( !foundry.utils.hasProperty(context.movement, key ) ) context.movement[key] = {};
			context.movement[key].value = movement;
			context.movement[key].label = SYSTEM.movement[key].label;
			context.movement[key].icon = SYSTEM.icons[key];
		}
		// LANGUAGES
		context.languages = Object.values(SYSTEM.languages).filter(i => context.system.languages.includes(i.id) ).map(i => i.label);
		
		// PROFICIENCIES
		context.proficiencies = Object.values({...SYSTEM.weapons, ...SYSTEM.armors}).filter(i => context.system.proficiencies.includes(i.id) ).map(i => i.label);

		// Prepare HitDie
		const classes = context.actor.items.filter(it=> it.type == 'class');
		context.hitDies = {value:0, max:0, dies:[]}
		for (const cls of classes) {
			context.hitDies.dies.push({
				...cls.system.hitDie,
				icon: `icons/svg/${cls.system.hitDie.die.replace(/^\d+/,'')}-grey.svg`
			});
		}
		context.hitDies.dies.reduce((acc,hd)=> acc + hd.value, context.hitDies.value );
		context.hitDies.dies.reduce((acc,hd)=> acc + hd.max, context.hitDies.max )

		// IRV
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

	/**
	 * Item Organization
	 */
	_prepareItems(context){
		const items = {
			abilities: [],
			actions: [],
			spells: [],
			inventory: {},
			features: [],
			class: [],
			path: [],
			progression: SYSTEM.characterProgression
		}
		const inventory = ['weapon','armor','equipment','clothing','loot','consumable'];
		const progression = ['legacy','curse','background'];
		const classPaths = ['class','path'];
		for (const item of this.document.items ) {
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
			if ( progression.includes(item.type) ) items[item.type] = item;
			if ( classPaths.includes(item.type) ) items[item.type].push(item);
		}
		
		context.items = items;
		this._prepareActions(context);
	}
	
	/**
	 * TODO - REFACTOR
	 * ABILITIES NEED AND FIElD TO CONFIGURE WICTH ITEMS THEY MAY BE USE WITH
	 * IE.: type: ['weapon'], descriptor.allowed: ['thrown','shooty']
	 * IE.: type: ['weapon','armor'] descriptor.notallowed: ['thrown','shooty']
	 * IE.: type: ['consumable'], descriptor.allowed: ['granade']
	 * @param {*} context
	 */
	_prepareActions(context) {
		context.items.actions = [];
		// Weapon Attack
		const _weaponAbilities = this.document.items.filter( i => i.type == 'ability' && i.system.descriptors.includes('weapon') );
		// Attack with Weapon
		const weapons = this.document.items.filter( i => (i.type == 'weapon' || (i.type == 'armor' && i.system.type == 'shield')) && i.system.equipped );
		for (const weapon of weapons) {
			weapon.abilities = _weaponAbilities;
			context.items.actions.push(weapon);
		}
		// for (const ability of _weaponAbilities) {
		// 	ability.weapons = weapons;
		// 	context.items.actions.push(ability);
		// }
		
		const abilities = this.document.items.filter( i => i.type == 'ability' && !i.system.descriptors.includes('weapon') );
		context.items.actions.push(...abilities);
		
		const spells = this.document.items.filter( i => i.type == 'spell' );
		context.items.actions.push(...spells);
		
		// Commom Actions
		context.items.actions.push( ...SYSTEM.actions );
	}
	
	_prepareFilters(context){
		const actions = this.filters.actions;
		const isRanged = (d) => ['thrown', 'shooting'].includes(d);
		const isMelee = (d) => !['shooting'].includes(d);
		for (const item of Object.values(context.items.actions)) {
			console.log(item);
			let show = true;
			// RANGED == FALSE? ESCONDE TUDO QUE TIVER ARREMESSO SHOOTING 
			if ( !actions.ranged.active && item.system.descriptors?.some(isRanged) )show = false;
			// MELEE == FALSE? ESCONDE TUDO QUE TIVER ARREMESSO SHOOTING
			if ( !actions.melee.active && !item.system.descriptors?.some(isMelee) ) show = false;
			
			if ( item.system.action && !actions[item.system.action]?.active ) show = false;
			item.filtered = show ? '' : 'hidden';
		}

	}
	

	_prepareProgression(context){
		/* LIST ENTRIES AND FEATURES */
		/* MAPPING FIELD? */
		const prog = {
			legacy: {uuid: "", choices: [{key:"data.path",value:""}], features: [{uuid:""}]},
			curse: {uuid: "", choices: [], features: []},
			feat0: {uuid: "", choices: [], features: []},
			background: {uuid: "", choices: [], features: []},
			level1: {},
			level2: {uuid: "", choices: [], features: []},
			basicpath: {uuid: "", choices: [], features: []},
			level3: {uuid: "", choices: [], features: []},
			level4: {uuid: "", choices: [], features: []},
			level5: {uuid: "", choices: [], features: []},
			level6: {uuid: "", choices: [], features: []},
			level7: {uuid: "", choices: [], features: []},
			advancedpath: {uuid: "", choices: [], features: []},
			level8: {uuid: "", choices: [], features: []},
			level9: {uuid: "", choices: [], features: []},
			level10: {uuid: "", choices: [], features: []},
			level11: {uuid: "", choices: [], features: []},
			level12: {uuid: "", choices: [], features: []},
		}

	}

	/* ---------------------------------------- */
	/*              EVENT HANDLERS              */
	/* ---------------------------------------- */

	static #inventoryDisplay(event, target){
		this.inventory = this.inventory != 'default' ? 'default' : 'category';
		this.render();
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