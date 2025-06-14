import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { SkyfallSheetMixin } from "./base.mjs";
const { ActorSheetV2 } = foundry.applications.sheets;
const TextEditor = foundry.applications.ux.TextEditor.implementation;
const TEMPLATES = `systems/skyfall/templatesV13`;

export default class SkyfallGuildSheet extends SkyfallSheetMixin(ActorSheetV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		window:{
			resizable: true,
		},
		classes: ["skyfallV13", "actor", "guild", "standard-form"],
		position: { width: 600, height: 660 },
		actions: {
			startArc: SkyfallGuildSheet.#startArc,
			endArc: SkyfallGuildSheet.#endArc,
			founder: SkyfallGuildSheet.#founderMember,
			retire: SkyfallGuildSheet.#retireMember,
			deleteMember: SkyfallGuildSheet.#removeMember,
			inventoryDisplay: SkyfallGuildSheet.#inventoryDisplay,
			itemToChat: SkyfallGuildSheet.#itemToChat,
		}
	};

	/** @override */
	static PARTS = {
		tabs: {
			template: "templates/generic/tab-navigation.hbs"
		},
		profile: {
			template: `${TEMPLATES}/actor/guild-profile.hbs`,
			templates: [
				`${TEMPLATES}/actor/guild/ability.hbs`,
				`${TEMPLATES}/actor/guild/actions.hbs`,
			]
		},
		members: {
			template: `${TEMPLATES}/actor/guild-members.hbs`,
		},
		abilities: {
			template: `${TEMPLATES}/actor/guild-abilities.hbs`,
			templates: [
				`${TEMPLATES}/item/ability/guild-card.hbs`,
				`${TEMPLATES}/item/ability/sigil-card.hbs`,
			]
		},
		facilities: {
			template: `${TEMPLATES}/actor/guild-facilities.hbs`,
		},
		inventory: {
			template: `${TEMPLATES}/actor/guild-inventory.hbs`,
			scrollable: [".actor-inventory"]
		},
		effects: {
			template: `${TEMPLATES}/shared/active-effects.hbs`,
		},
	}

	/** @override */
	static TABS = {
		profile: {id: "profile", group: "actor", label: "SKYFALL.TAB.GUILD", cssClass: 'active'},
		members: {id: "members", group: "actor", label: "SKYFALL2.GUILD.MemberPl"},
		abilities: {id: "abilities", group: "actor", label: "SKYFALL.TAB.ACTIONS"},
		facilities: {id: "facilities", group: "actor", label: "SKYFALL2.GUILD.FacilityPl"},
		inventory: {id: "inventory", group: "actor", label: "SKYFALL.TAB.INVENTORY" },
		effects: {id: "effects", group: "actor", label: "SKYFALL.TAB.EFFECTS" },
	};

	filters = {
		actions: { 
			cunning: {
				active: true,
				icon: SYSTEM.icons.sfcunning,
				label: "SKYFALL2.GUILD.Cunning",
			},
			knowledge: {
				active: true,
				icon: SYSTEM.icons.sfknowledge,
				label: "SKYFALL2.GUILD.Knowledge",
			},
			crafting: {
				active: true,
				icon: SYSTEM.icons.sfcrafting,
				label: "SKYFALL2.GUILD.Crafting",
			},
			reputation: {
				active: true,
				icon: SYSTEM.icons.sfreputation,
				label: "SKYFALL2.GUILD.Reputation",
			},
		}
	}
	/** @override */
	tabGroups = {
		actor: "profile"
	};

	inventory = 'default';

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
		options.parts = ["tabs", "profile", "members", "abilities", "facilities", "inventory", "effects"];
	}
	
	/** @override */
	async _preparePartContext(partId, context) {
		const doc = this.document;
		
		switch ( partId ) {
			case "tabs":
			case "profile":
			case "members":
			case "abilities":
			case "facilities":
			case "effects":
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
			filters: this.filters,
			currentArc: skyfall.ui.sceneConfig.scene.guildArc,
			effects: prepareActiveEffectCategories( doc.effects.filter(ef=> ef.type == 'base') ),
			modifications: prepareActiveEffectCategories( doc.effects.filter(ef=> ef.type == 'modification'), 'modification' ),
			enriched: {
				motto: await TextEditor.enrichHTML(doc.system.motto, enrichmentOptions),
			},
			embeds: {},
			tabs: this._getTabs(),
			isEditMode: this.isEditMode,
			isPlayMode: this.isPlayMode,
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
		await this._prepareItems(context);
		await this._prepareAbilities(context);
		await this._prepareMembers(context);
		this._prepareFilters(context);
		// if ( context.items.abilities ) {
		// 	context.enriched.debug = await TextEditor.enrichHTML(`<div>@Embed[${context.items.abilities[0].uuid}]{TESTE}</div>`, enrichmentOptions);
		// }
		// console.log(context);
		return context;
	}

	_prepareSystemData(context){
		
	}

	async _prepareItems(context) {
		const items = {
			seals: [],
			facilities: [],
			abilities: [],
			actions: [],
			sigils: [],
			features: [],
			inventory: {},
		}
		const inventory = ['weapon','armor','equipment','clothing','loot','consumable'];
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
			if ( item.type == 'guild-ability' ) {
				item.card = await item.system.prepareCardData();
				if ( !item._enriched ) {
					try {
						const embedded = await item.toEmbed({
							isFigure: false,
							collapse: true,
							embeddedAt: "ActorSheet",
						}, {
						});
						if ( embedded ) {
							item._enriched = embedded.innerHTML;
						}
					} catch (error) {
						console.error(error);
						item._enriched = item.toAnchor({
							name: `Error Enriching Card for ${item.name}`,
						}).outerHTML;
					}
				}
				items.abilities.push(item);
				items.actions.push(item);
			}
			if ( item.type == 'seal' ) items.seals.push(item);
			if ( item.type == 'sigil' ) items.sigils.push(item);
			if ( item.type == 'facility' ) items.facilities.push(item);
			if ( item.type == 'feature' ) items.features.push(item);
		}
		context.items = items;
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
				if ( item.type != "guild-ability" ) continue;
				const ability = item.system.type;
				if ( ability && valid(filters, ability) ) show = false;
				item.filters ??= {};
				item.filters[key] = show ? '' : 'hidden';
				console.groupEnd();
			}
			console.groupEnd();
		}
	}

	async _prepareAbilities(context){
		const level = context.system.level;
		for (const [key, abl] of Object.entries( context.system.abilities )) {
			const ol = skyfall.utils.createHTMLElement({
				tag:'ol', cssClasses: ['plain','ability-tooltip']
			});
			const properties = {
				members: "SKYFALL2.GUILD.MemberPl",
				seals: "SKYFALL2.GUILD.SealPl",
				facilities: "SKYFALL2.GUILD.FacilityPl",
				level: "SKYFALL2.Level",
				bonus: "SKYFALL2.Bonus",
				value: "SKYFALL2.Total",
			};
			for (const [prop, label] of Object.entries(properties)) {
				if ( prop == 'level' && key != 'reputation' ) continue;
				let name = skyfall.utils.createHTMLElement({
					tag:'div', cssClasses: ['name'], content: game.i18n.localize(label)
				});
				let value = skyfall.utils.createHTMLElement({
					tag:'div', cssClasses: ['value'],
					content: ( key == 'reputation' && prop == 'level' ? level : `${abl[prop]}` )
				});
				let _li = skyfall.utils.createHTMLElement({
					tag:'li', cssClasses: ['flexrow']
				});
				_li.append(name, value);
				ol.append(_li);
			}
			abl.tooltip =  `<section class='property-summary'>${ol.outerHTML}</section>`;
			abl.tooltip = abl.tooltip.replaceAll('"',"'");
		}
	}

	async _prepareMembers(context){
		context.members = [];
		for (const member of context.system.members ) {
			const actor = await fromUuid(member.uuid);
			actor.founder = member.founder;
			actor.retired = member.retired;
			context.members.push( actor );
		}
	}

	static async #founderMember(event, target) {
		const index = target.closest('li').dataset.index;
		const guild = this.document;
		let members = guild.system.members;
		members[index].founder = !members[index].founder;
		guild.update({"system.members": members});
	}

	static async #retireMember(event, target) {
		const index = target.closest('li').dataset.index;
		const guild = this.document;
		let members = guild.system.members;
		members[index].retired = !members[index].retired;
		guild.update({"system.members": members});
	}

	static async #removeMember(event, target) {
		const index = target.closest('li').dataset.index;
		const guild = this.document;
		let members = guild.system.members.filter( (m, i) => i != index );
		guild.update({"system.members": members});
	}

	async _onDrop(event) {
		event.preventDefault();
		const target = event.target;
		const {type, uuid} = TextEditor.getDragEventData(event);
		if (!this.isEditable) return;
		if ( type == "Actor" ){
			const actor = fromUuidSync(uuid);
			if ( actor.type != 'character' ) return;
			this._onDropMember(uuid);
		} else return super._onDrop(event);
	}

	_onDropMember( uuid ){
		if ( !uuid.startsWith("Actor") ) {
			ui.notifications.warn("SKYFALL2.NOTIFICATIONS.GuildMemberNotSync")
			return;
		};
		const actor = fromUuidSync( uuid );
		if ( actor.type != 'character' ) {
			ui.notifications.warn("SKYFALL2.NOTIFICATIONS.GuildMemberNotSync")
			return;
		}
		if ( !actor ) {
			ui.notifications.warn("SKYFALL2.NOTIFICATIONS.GuildMemberNotSync")
			return;
		}
		let member = this.document.system.members;
		member.push({uuid: uuid})
		this.document.update({"system.members": member});
	}

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
	
	/* Guild Arc */
	
	static async #startArc(event, target) {
		const { DialogV2 } = foundry.applications.api;
		const arcLength = await DialogV2.wait({
			window: { title: game.i18n.localize(`SKYFALL2.DIALOG.StartGuildArc`) },
			content: game.i18n.localize(`SKYFALL2.DIALOG.StartGuildArcHint`),
			buttons: [
				{
					action: "short",
					label: game.i18n.localize(`SKYFALL2.DIALOG.GuildArcShort`),
					icon: "fa-regular fa-clock", default: true
				},
				{
					action: "long",
					label: game.i18n.localize(`SKYFALL2.DIALOG.GuildArcLong`),
					icon: "fa-solid fa-clock",
				}
			]
		});
		
		if ( !arcLength ) return;
		this.document.system.startGuildArc({
			arcLength: arcLength
		});
	}

	static async #endArc(event, target) {
		this.document.system.endGuildArc();
	}
}