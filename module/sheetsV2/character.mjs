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
			promptBenefitsDialog: CharacterSheetSkyfall.#promptBenefitsDialog,
		}
	};

	/** @override */
	static PARTS = {
		aside: {
			template: "systems/skyfall/templates/v2/actor/aside.hbs"
		},
		tabs: {
			template: "templates/generic/tab-navigation.hbs"
		},
		actions: {
			template: "systems/skyfall/templates/v2/actor/actions.hbs",
			templates: [
				"systems/skyfall/templates/v2/actor/actions-ability-scores.hbs",
				"systems/skyfall/templates/v2/actor/actions-abilities.hbs",
				"systems/skyfall/templates/v2/actor/actions-skills.hbs",
			],
			scrollable: [""]
		},
		features: {
			template: "systems/skyfall/templates/v2/actor/features.hbs",
			templates: [
				"systems/skyfall/templates/v2/actor/features-progression.hbs",
				"systems/skyfall/templates/v2/actor/progression-list.hbs",
				"systems/skyfall/templates/v2/actor/widgets/xp.hbs",
			],
			scrollable: [""]
		},
		abilities: {
			template: "systems/skyfall/templates/v2/actor/abilities.hbs",
			templates: [
				"systems/skyfall/templates/v2/item/ability-card.hbs",
				"systems/skyfall/templates/v2/item/sigil-card.hbs",
			],
			scrollable: [""]
		},
		spells: {
			template: "systems/skyfall/templates/v2/actor/spells.hbs",
			scrollable: [""]
		},
		inventory: {
			template: "systems/skyfall/templates/v2/actor/inventory.hbs",
			scrollable: [""]
		},
		biography: {
			template: "systems/skyfall/templates/v2/actor/biography.hbs",
			scrollable: [""]
		},
		effects: {
			template: "systems/skyfall/templates/v2/shared/effects.hbs",
			scrollable: [""]
		},
	}

	/** @override */
	static TABS = {
		actions: {id: "actions", group: "actor", label: "SKYFALL.TAB.ACTIONS", cssClass: 'active'},
		features: {id: "features", group: "actor", label: "SKYFALL.TAB.FEATURES" },
		abilities: {id: "abilities", group: "actor", label: "SKYFALL.TAB.ABILITIES" },
		spells: {id: "spells", group: "actor", label: "SKYFALL.TAB.SPELLS" },
		inventory: {id: "inventory", group: "actor", label: "SKYFALL.TAB.INVENTORY" },
		biography: {id: "biography", group: "actor", label: "SKYFALL.TAB.BIOGRAPHY" },
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
			sigil: {
				active: true,
				icon: SYSTEM.icons.gem,
				label:"TYPES.Item.sigil"
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
		},
		abilities: {
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
		},
		spells: {
			// cantrip: {
			// 	active: true,
			// 	icon: game.i18n.localize("SKYFALL.SPELLLAYERS.CANTRIP").charAt(0),
			// 	label: "SKYFALL.SPELLLAYERS.CANTRIP"
			
			// },
			// superficial: {
			// 	active: true,
			// 	icon: game.i18n.localize("SKYFALL.SPELLLAYERS.SUPERFICIAL").charAt(0),
			// 	label: "SKYFALL.SPELLLAYERS.SUPERFICIAL"
			// },
			// shallow: {
			// 	active: true,
			// 	icon: game.i18n.localize("SKYFALL.SPELLLAYERS.SHALLOW").charAt(0),
			// 	label: "SKYFALL.SPELLLAYERS.SHALLOW"
			// },
			// deep: {
			// 	active: true,
			// 	icon: game.i18n.localize("SKYFALL.SPELLLAYERS.DEEP").charAt(0),
			// 	label: "SKYFALL.SPELLLAYERS.DEEP"
			// },
			control: {
				active: true,
				icon: SYSTEM.icons.sfspellcontrol,
				label:"SKYFALL.DESCRIPTORS.CATEGORY.CONTROL"
			},
			ofensive: {
				active: true,
				icon: SYSTEM.icons.sfspellofensive,
				label:"SKYFALL.DESCRIPTORS.CATEGORY.OFENSIVE",
			},
			utility: {
				active: true,
				icon: SYSTEM.icons.sfspellutility,
				label:"SKYFALL.DESCRIPTORS.CATEGORY.UTILITY"
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

	/* ---------------------------------------- */
	/* DRAG AND DROP HANDLERS                   */
	/* ---------------------------------------- */

	async _onDrop(event) {
		return super._onDrop(event);
	}

	/* ---------------------------------------- */
	/* RENDER                                   */
	/* ---------------------------------------- */

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		if (this.document.limited) return;
		options.parts = ["aside", "tabs", "actions", "features", "abilities", "spells", "inventory", "biography", "effects"];
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
			SYSTEM: SYSTEM,
			flags: {
				disableExperience: game.settings.get('skyfall','disableExperience'),
			},
			document: doc,
			actor: doc,
			user: game.user,
			system: doc.system,
			source: src.system,

			schema: this._getDataFields(),
			progression: await doc.system._progression(),
			filters: this.filters,
			items: {},
			effects: prepareActiveEffectCategories( doc.effects.filter(ef=> ef.type == 'base') ),
			modifications: prepareActiveEffectCategories( doc.effects.filter(ef=> ef.type == 'modification'), 'modification' ),
			enriched: {
				biography: await TextEditor.enrichHTML(doc.system.biography, enrichmentOptions),
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
		await this._prepareItems(context);
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
		context.irv.vulnerability = [];
		context.irv.resistance = [];
		context.irv.imunity = [];
		conditionImunity.forEach((k) => {
			context.irv.imunity.push({
				id: k,
				label: SYSTEM.conditions[k].name,
				type: 'condition',
			});
		});
		Object.entries(damageTaken).forEach( ([k,v]) => {
			if ( v == "normal" || !v ) return;
			context.irv[v].push({
				id: k,
				label: SYSTEM.DESCRIPTOR.DAMAGE[k].label,
				hint: SYSTEM.DESCRIPTOR.DAMAGE[k].hint,
				type: 'descriptor',
			});
		});
	}

	/**
	 * Item Organization
	 */
	async _prepareItems(context){
		const items = {
			abilities: [],
			actions: [],
			spells: [],
			inventory: {},
			sigils: [],
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
				if ( item.system.packCapacity ) {
					item.system.volume = Math.floor(item.system.capacity / item.system.packCapacity) * item.system.quantity;
				} else {
					item.system.volume = item.system.capacity * item.system.quantity;
				}
				if ( this.inventory == 'category' ) {
					items.inventory[item.type] ??= [];
					items.inventory[item.type].push(item);
				} else {
					items.inventory.category ??= [];
					items.inventory.category.push(item);
				}
			}
			if ( ['feature','feat'].includes(item.type) ) items.features.push(item);
			if ( item.type == 'ability' ) {
				items.abilities.push(item);
				if ( !item._enriched ) {
					const embedded = await item.toEmbed({
						isSheetEmbedded: true,
						isFigure: false,
						collapse: true,
					}, {});
					item._enriched = embedded.innerHTML;
				}
			}
			if ( item.type == 'spell' ) {
				items.spells.push(item);
				if ( !item._enriched ) {
					const embedded = await item.toEmbed({
						isSheetEmbedded: true,
						isFigure: false,
						collapse: true,
					}, {});
					item._enriched = embedded.innerHTML;
				}
			} 
			if ( item.type == 'sigil' ) {
				items.sigils.push(item);
				if ( !item._enriched ) {
					const embedded = await item.toEmbed({
						isSheetEmbedded: true,
						isFigure: false,
						collapse: true,
					}, {});
					item._enriched = embedded.innerHTML;
				}
			}
			if ( progression.includes(item.type) ) items[item.type] = item;
			if ( classPaths.includes(item.type) ) items[item.type].push(item);
		}
		const spellLayer = {
			'cantrip': 0,
			'superficial': 1,
			'shallow': 2,
			'deep': 3,
		}
		items.spells.sort( (a, b) => {
			const layerA = spellLayer[a.system.spellLayer];
			const layerB = spellLayer[b.system.spellLayer];
			return layerA > layerB ? 1 : layerA < layerB ? -1 : 0;
		});
		let layer = '';
		for (const spell of items.spells) {
			if ( layer != spell.system.layerLabel ) {
				spell.layerLabel = spell.system.layerLabel;
			}
			layer = spell.system.layerLabel;
		}

		context.items = items;
		this._prepareActions(context);
	}
	
	/**
	 * TODO - REFACTOR
	 * ABILITIES NEED A FIELD TO CONFIGURE WHICH ITEMS THEY MAY BE USE WITH?
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
			if ( weapon.system.purpose == 'melee' ) {
				weapon.abilities = _weaponAbilities;
				//.filter( i=> i.system.range.units == 'touch' );
			} else {
				weapon.abilities = _weaponAbilities.filter( i=> i.system.range.units == 'm' );
			}
			context.items.actions.push(weapon);
		}
		
		const sigils = this.document.items.filter( i => i.type == 'sigil' && context.items.actions.find(a => a.uuid == i.system.item) );
		context.items.actions.push(...sigils);

		const abilities = this.document.items.filter( i => i.type == 'ability' && !i.system.descriptors.includes('weapon') );
		context.items.actions.push(...abilities);
		
		const spells = this.document.items.filter( i => i.type == 'spell' );
		context.items.actions.push(...spells);
		
		// Commom Actions
		context.items.actions.push( ...SYSTEM.actions );
	}
	
	_prepareFilters(context){
		let valid = (filters, key) => {
			return filters[key] && !filters[key].active;
		}
		for (const [key, filters] of Object.entries(this.filters)) {
			console.groupCollapsed(`${key} Filter`);
			const list = context.items[key];
			for (const item of Object.values(list)) {
				console.groupCollapsed(`Filter: ${item.name}`);
				let show = true;
				const action = item.type == 'weapon' ? 'action' : item.system?.action;
				const sigil = item.type == 'sigil';
				const tags = new Set(item.system.descriptors);
				if ( item.system?.isRanged && valid(filters, 'ranged') ) show = false;
				if ( item.system?.isMelee && valid(filters, 'melee') ) show = false;
				if ( action && valid(filters, action) ) show = false;
				if ( sigil && valid(filters, 'sigil') ) show = false;
				if ( tags.has('control') && valid(filters, 'control') ) show = false;
				if ( tags.has('ofensive') && valid(filters, 'ofensive') ) show = false;
				if ( tags.has('utility') && valid(filters, 'utility') ) show = false;

				item.filters ??= {};
				item.filters[key] = show ? '' : 'hidden';
				console.groupEnd();
			}
			console.groupEnd();
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

	static async #promptBenefitsDialog(event, target) {
		const document = this.document;
		const { originId } = target.dataset;
		const { entryId } = target.closest('li').dataset;
		if ( entryId ) {
			// PROMPT THE DIALOG FOR EXISTING ITEM
			const item = document.items.find( i => i.id == entryId );
			if ( !item ) return;
			let level = 0;
			if ( 'level' in item.system ) {
				level = (item.system.origin.indexOf(originId) ?? 0) + 1;
			}
			let {BenefitsDialog} = skyfall.applications;
			BenefitsDialog.prompt({item: item, grant: originId, level: level});
		} else {
			// ITEM DOES NOT EXIST
			const item = document.items.find( i => 'benefits' in i.system && i.system.benefits.some( b => b._id == originId ));
			if ( !item ) return;
			
			let {BenefitsDialog} = skyfall.applications;
			BenefitsDialog.prompt({item: item, grant: originId});
		}
	}
}