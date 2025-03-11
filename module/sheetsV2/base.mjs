import ActorResources from "../apps/actor-resources.mjs";
import ActorTraits from "../apps/actor-traits.mjs";
import ActorTraitsV2 from "../apps/actor-traitsV2.mjs";

import ShortRestV2 from "../apps/restV2.mjs";
import RestConfig from "../apps/rest-config.mjs";
import ShortRest from "../apps/short-rest.mjs";
import { SYSTEM } from "../config/system.mjs";
import { weapons } from "../config/types.mjs";
import AbilityDescriptorsConfig from "../apps/descriptors-config.mjs";
const {HandlebarsApplicationMixin} = foundry.applications.api;
const {ItemSheetV2} = foundry.applications.sheets;

/**
 * @typedef {object} TabConfiguration
 * @property {string} id        The unique key for this tab.
 * @property {string} group     The group that this tab belongs to.
 * @property {string} label     The displayed label for this tab.
 */

/**
 * Sheet class mixin to add common functions shared by all types of sheets.
 * @param {*} Base               The base class.
 * @returns {DocumentSheet}      Extended class.
 */
export const SkyfallSheetMixin = Base => {
	const {HandlebarsApplicationMixin} = foundry.applications.api;
	return class BaseSheetSkyfall extends HandlebarsApplicationMixin(Base) {

		/**
		 * Different sheet modes.
		 * @enum {number}
		 */
		static SHEET_MODES = {EDIT: 0, PLAY: 1};

		/** @override */
		static DEFAULT_OPTIONS = {
			form: {
				handler: this.#onSubmitDocumentForm,
				submitOnChange: true,
			},
			actions: {
				toggleMode: BaseSheetSkyfall.#onToggleMode,
				editImage: BaseSheetSkyfall.#onEditImage,
				create: BaseSheetSkyfall.#onCreate,
				edit: BaseSheetSkyfall.#onEdit,
				// update: BaseSheetSkyfall.#onUpdate,
				delete: BaseSheetSkyfall.#onDelete,
				toggle: BaseSheetSkyfall.#onToggle,
				vary: {handler: BaseSheetSkyfall.#onVary, buttons: [0, 2]},
				use: {handler: BaseSheetSkyfall.#onUse, buttons: [0, 2]},
				abilityUse: {handler: BaseSheetSkyfall.#onAbilityUse, buttons: [0, 2]},
				itemRecharge: {handler: BaseSheetSkyfall.#onItemRecharge, buttons: [0]},
				roll: {handler: BaseSheetSkyfall.#onRoll, buttons: [0, 2]},
				manage: BaseSheetSkyfall.#onManage,
				filter: {handler: BaseSheetSkyfall.#onFilter, buttons: [0, 2]},
				collapse: BaseSheetSkyfall.#onCollapse,
				collapseAll: BaseSheetSkyfall.#onCollapseAll,
				expandAll: BaseSheetSkyfall.#onExpandAll,
				logToConsole: BaseSheetSkyfall.#logToConsole,
				convertItem: BaseSheetSkyfall.#convertItem,
				createRoll: BaseSheetSkyfall.#createRoll,
				deleteRoll: BaseSheetSkyfall.#deleteRoll,
				createTerm: BaseSheetSkyfall.#createTerm,
				deleteTerm: BaseSheetSkyfall.#deleteTerm,
			}
		};

		/**
		 * The current sheet mode.
		 * @type {number}
		 */
		_sheetMode = this.constructor.SHEET_MODES.PLAY;

		/**
		 * Is the sheet currently in 'Play' mode?
		 * @type {boolean}
		 */
		get isPlayMode() {
			return this._sheetMode === this.constructor.SHEET_MODES.PLAY;
		}

		/**
		 * Is the sheet currently in 'Edit' mode?
		 * @type {boolean}
		 */
		get isEditMode() {
			return this._sheetMode === this.constructor.SHEET_MODES.EDIT;
		}

		/** @override */
		tabGroups = {};

		/**  */
		collapsed = [];
		rolling = null;

		/**
		 * Tabs that are present on this sheet.
		 * @enum {TabConfiguration}
		 */
		static TABS = {};

		/**
		 * Utility method for _prepareContext to create the tab navigation.
		 * @returns {object}
		 */
		_getTabs() {
			return Object.values(this.constructor.TABS).reduce((acc, v) => {
				const isActive = this.tabGroups[v.group] === v.id;
				acc[v.id] = {
					...v,
					active: isActive,
					cssClass: isActive ? "item active" : "item",
					tabCssClass: isActive ? "tab scrollable active" : "tab scrollable"
				};
				return acc;
			}, {});
		}


		/** @override */
		_onFirstRender(context, options) {
			super._onFirstRender(context, options);
			this._setupContextMenu();
		}

		/** @override */
		_onRender(context, options) {
			super._onRender(context, options);

			if (this.isEditable) {
				// TODOS DELTA?
			} else {
				// Disable fields.
				this.element.querySelectorAll("a, buttons, input, select, textarea, multi-select").forEach(f => {
					f.disabled = true;
				});
			}
			if ( ['character','npc','partner','creation'].includes(this.document.type) ) this._getPlayMode();
			this._setupDragAndDrop();
		}

		_getPlayMode(){
			const tabs = this.element.querySelector("nav.tabs");
			const toggleMode = document.createElement("a");
			toggleMode.classList = "toggle-mode";
			toggleMode.dataset.action = "toggleMode";
			toggleMode.innerHTML = ( this._sheetMode ? `<i class="fa-solid fa-lock"></i>` : `<i class="fa-solid fa-lock-open"></i>` );
			tabs.append(toggleMode);
		}
		/** @override */
		_syncPartState(partId, newElement, priorElement, state) {
			super._syncPartState(partId, newElement, priorElement, state);
		}


		/** @inheritDoc */
		async _renderFrame(options) {
			const frame = await super._renderFrame(options);
			
			// Add console.log button
			const logLabel = game.i18n.localize("CONSOLE.LOG");
			const logBtn = `<button type="button" class="header-control fa-solid fa-terminal" data-action="logToConsole" data-tooltip="${logLabel}" aria-label="${logLabel}"></button>`;
			this.window.close.insertAdjacentHTML("beforebegin", logBtn);
			// const convertBtn = `<button type="button" class="header-control fa-solid fa-recycle" data-action="convertItem" data-tooltip="CONVERT" aria-label="CONVERT"></button>`;
			// this.window.close.insertAdjacentHTML("beforebegin", convertBtn);
			
			return frame;
		}

		/* ---------------------------------------- */
		
		/**
		 * Prepare effects for rendering.
		 * @returns {object[]}
		 */
		
		async _prepareEffects(type = 'base' ) {
			// Define effect header categories
			const categories = {};
			foundry.utils.mergeObject( categories, (type == 'modification' ? {
				modification: {
					type: 'modification',
					label: game.i18n.localize('SKYFALL.EFFECT.MODIFICATION'),
					effects: [],
				},
				temporary: {
					type: 'temporary',
					label: game.i18n.localize('SKYFALL.EFFECT.MODIFICATIONTEMP'),
					effects: [],
				},
			} : {
				temporary: {
					type: 'temporary',
					label: game.i18n.localize('SKYFALL.EFFECT.TEMPORARY'),
					effects: [],
				},
				passive: {
					type: 'passive',
					label: game.i18n.localize('SKYFALL.EFFECT.PASSIVE'),
					effects: [],
				},
				inactive: {
					type: 'inactive',
					label: game.i18n.localize('SKYFALL.EFFECT.INACTIVE'),
					effects: [],
				},
			}));

			// Iterate over active effects, classifying them into categories
			for (let e of this.effects) {
				if (e.type == 'modification' && e.isTemporary) {
					categories.temporary.effects.push(e);
				} else if ( e.type == 'modification' ) {
					categories.modification.effects.push(e);
				} else if (e.disabled) categories.inactive.effects.push(e);
				else if (e.isTemporary) categories.temporary.effects.push(e);
				else categories.passive.effects.push(e);
			}
			return categories;
		}

		/* PREPARE SYSTEM DATAFIELDS */
		_getDataFields(){
			const doc = this.document;
			const schema = doc.system.schema;
			const dataFields = foundry.utils.flattenObject(doc.system.toObject());
			
			dataFields['name'] = doc.schema.getField('name');
			dataFields['img'] = doc.schema.getField('img');
			for (const fieldPath of Object.keys(dataFields)) {
				dataFields[fieldPath] = schema.getField(fieldPath);
			}
			
			return foundry.utils.expandObject(dataFields);
		}

		/* ---------------------------------------- */
		/*           Context Menu Handlers          */
		/* ---------------------------------------- */

		/**
		 * Bind a new context menu.
		 */
		_setupContextMenu() {
			const itemTypes = ["weapon","armor","clothing","equipment","consumable","loot"];
			
			new ContextMenu(this.element, '.window-content [data-create-list]', [], {
				eventName: "click",
				onOpen: entry => {
					ui.context.menuItems = itemTypes.map( type => {
						return {
							name: `TYPES.Item.${type}`,
							icon: SYSTEM.icons.create,
							callback: li => this.document.createEmbeddedDocuments("Item",[{
								type:type,
								name: game.i18n.format("DOCUMENT.Create", {
									type: game.i18n.localize(`TYPES.Item.${type}`)
								}),
							}])
						}
					})
				}
			});
			new ContextMenu(this.element, '.window-content .class, .window-content .path', [], {
				onOpen: entry => {
					const entryId = entry.dataset.entryId;
					const item = this.document.items.find(it => it.id==entryId);
					if ( !item ) return;
					ui.context.menuItems = [{
						name: "SKYFALL.EDIT",
						icon: "<i class='fas fa-edit fa-fw'></i>",
						condition: () => item.isOwner,
						callback: () => item.sheet.render(true),
					},
					{
						name: "SKYFALL.DELETE",
						icon: "<i class='fas fa-trash fa-fw'></i>",
						condition: () => item.isOwner,
						callback: li => this.document.deleteEmbeddedDocuments( "Item", [item.id] )
					}];
				}
			});

			new ContextMenu(this.element, '.window-content .class-level', [], {
				onOpen: entry => {
					const originId = entry.dataset.level;
					const classes = this.document.items.filter(i => i.type == 'class');
					if ( !classes || !originId ) return;
					ui.context.menuItems = classes.map(i => ({
						name: i.name, icon: '',
						condition: () => this.document.isOwner,
						callback: () => i.system.levelUp(originId), //updateLevel(i, level),
					}));
					ui.context.menuItems.push({
						name: "SKYFALL2.Delete", icon: '',
						condition: () => this.document.isOwner,
						callback: () => {
							const updateData = {};
							updateData['items'] = [];
							for (const cls of classes) {
								const origin = cls.system.origin;
								const lvl = String(originId).padStart(2, 0);
								origin.findSplice( o => o == `class-${lvl}`);
								updateData['items'].push({
									_id: cls.id,
									'system.origin': origin,
								});
							}
							this.document.update(updateData);
						}
					})
				}
			});
		}

		/* ---------------------------------------- */
		/*           DRAG AND DROP HANDLERS         */
		/* ---------------------------------------- */

		/**
		 * Set up drag-and-drop handlers.
		 */
		_setupDragAndDrop() {
			const dd = new DragDrop({
				dragSelector: "[data-entry-id]", // .wrapper
				dropSelector: ".application",
				permissions: {
					dragstart: this._canDragStart.bind(this),
					drop: this._canDragDrop.bind(this)
				},
				callbacks: {
					dragstart: this._onDragStart.bind(this),
					drop: this._onDrop.bind(this)
				}
			});
			dd.bind(this.element);
		}

		/**
		 * Can the user start a drag event?
		 * @param {string} selector     The selector used to initiate the drag event.
		 * @returns {boolean}
		 */
		_canDragStart(selector) {
			return true;
		}

		/**
		 * Can the user perform a drop event?
		 * @param {string} selector     The selector used to initiate the drop event.
		 * @returns {boolean}
		 */
		_canDragDrop(selector) {
			return this.isEditable && this.document.isOwner;
		}

		/**
		 * Handle a drag event being initiated.
		 * @param {Event} event
		 */
		async _onDragStart(event) {
			const id = event.currentTarget.closest("[data-entry-id]").dataset.entryId;
			const uuid = event.currentTarget.closest("[data-entry-id]").dataset.itemUuid;

			const item = this.document.items?.get(id) ?? this.document.effects?.get(id) ?? await fromUuid(uuid);
			if ( !item ) return;
			const data = item.toDragData();
			event.dataTransfer.setData("text/plain", JSON.stringify(data));
		}

		/**
		 * Handle a drop event.
		 * @param {Event} event
		 */
		async _onDrop(event) {
			event.preventDefault();
			const target = event.target;
			const {type, uuid} = TextEditor.getDragEventData(event);
			if (!this.isEditable) return;
			const item = await fromUuid(uuid);
			const itemData = item.toObject();
			if ( item.pack ){
				itemData._stats.compendiumSource = item.uuid;
			}
			// Disallow dropping invalid document types.
			if (!Object.keys(this.document.constructor.metadata.embedded).includes(type)) return;
			// If dropped onto self, perform sorting.
			if (item.parent === this.document) {
				if( target.closest('.actor-progression') ) {
					return this._onSetOrigin(item, target);
				}
				return this._onSortItem(item, target);
			}

			const modification = {
				"-=_id": null,
				"-=ownership": null,
				"-=folder": null,
				"-=sort": null
			};

			switch (type) {
				case "ActiveEffect":
					foundry.utils.mergeObject(modification, {
						"duration.-=combat": null,
						"duration.-=startRound": null,
						"duration.-=startTime": null,
						"duration.-=startTurn": null,
					});
					break;
				case "Item":
					break;
				default: 
					return;
			}
			
			foundry.utils.mergeObject(itemData, modification, {performDeletions: true});
			getDocumentClass(type).create(itemData, {parent: this.document});
		}

		/**
		 * Perform sorting of items.
		 * @param {Item} item               The document being dropped.
		 * @param {HTMLElement} target      The direct target dropped onto.
		 */
		async _onSortItem(item, target) {
			const collection = ( item.documentName == "Item" ?
				this.actor?.items : ( item.documentName == "ActiveEffect" ? 
				this.document?.effects : null )
			)
			if ( !collection ) return;
			
			const self = target.closest(".item-list")?.querySelector(`[data-entry-id="${item.id}"]`);
			if (!self || !target.closest("[data-entry-id]")) return;

			let sibling = target.closest("[data-entry-id]") ?? null;
			if (sibling?.dataset.entryId === item.id) return;
			if (sibling) sibling = collection.get(sibling.dataset.entryId);

			let siblings = target.closest(".item-list").querySelectorAll("[data-entry-id]");
			siblings = Array.from(siblings).map(s => collection.get(s.dataset.entryId));
			siblings.findSplice(i => i === item);

			let updates = SortingHelpers.performIntegerSort(item, {target: sibling, siblings: siblings, sortKey: "sort"});
			updates = updates.map(({target, update}) => ({_id: target.id, sort: update.sort}));
			this.document.updateEmbeddedDocuments("Item", updates);
		}

		async _onSetOrigin(item, target) {
			const li = target.closest('li');
			const sourceId = li.dataset.sourceId;
			const rootItems = ['legacy','curse','background','class','path'];
			if ( rootItems.includes(item.type) && !sourceId.startsWith(item.type) ) {
				return;
			}
			if ( !li.classList.contains('empty') ) {
				// foundry.applications.api.DialogV2.prompt({content: 'SURE?'});
				return;
			}
			const updateData = {}
			console.warn('system.origin', [sourceId]);
			updateData['system.origin'] = [sourceId];
			item.update(updateData);
		}
		/* ---------------------------------------- */
		/*              EVENT HANDLERS              */
		/* ---------------------------------------- */

		async getDescriptors(context, types = []) {
			context.descriptors = {};
			context._selOpts['descriptors'] = {};
			const catDesc = this.document.type == 'sigil' ? Object.entries(SYSTEM.SIGILDESCRIPTOR) : Object.entries(SYSTEM.DESCRIPTOR);
			for ( const [category, descriptors] of catDesc ) {
				if ( types.length && !types.includes(category) ) continue;
				for (const [id, desc] of Object.entries(descriptors)) {
					context._selOpts['descriptors'][category.titleCase()] ??= {};
					context._selOpts['descriptors'][category.titleCase()][desc.id] = {
						...desc, 
						value: (context.system.descriptors.includes(desc.id))
					}
				}
				foundry.utils.mergeObject(context.descriptors, context._selOpts['descriptors'][category.titleCase()]);
			}
			for (const desc of context.system.descriptors) {
				if ( desc in context.descriptors ) continue;
				context._selOpts['descriptors']["Origin"][desc] = {
					id: desc, hint: "", type: ["origin"], label: desc.toUpperCase(), value: true
				}
			}
		}

		/* ---------------------------------------- */
		/*              EVENT HANDLERS              */
		/* ---------------------------------------- */

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static async #onCreate(event, target) {
			const create = target.dataset.create;
			if ( create == "skill" ) {
				let type = 'custom'; //taget.dataset.type;
				const select = document.createElement("select");
				for (const skill of Object.values( SYSTEM.skills )) {
					if ( skill.type != "apti" ) continue;
					const option = document.createElement("option");
					option.value = skill.id;
					option.innerText = skill.label;
					select.append(option);
				}
				const label = await Dialog.prompt({
					title: game.i18n.localize("SKYFALL.SHEET.NEWSKILL"),
					content: `<form><div class="form-group"><label>${game.i18n.localize("SKYFALL.ACTOR.SKILL")}</label>${select.outerHTML}</div></form>`,
					callback: html => {
						return html[0].querySelector('select').value
					},
					options: {width: 260}
				});
				
				let key = label; // label.slice(0,4).toLowerCase();
				
				const updateData = {};
				updateData[`system.skills.${key}.value`] = 1;
				if ( SYSTEM.skills[key]?.type == 'apti' ) {
				} else if ( key in this.actor.system.skills ) return ui.notifications.warn("SKYFALL.ALERTS.DUPLICATESKILL");
				
				await this.actor.update(updateData);
			} if ( create == "heritage" ) { // DEPRECATE
				const updateData = {}
				const key = Object.keys(this.document.system.heritages).length;
				updateData[`system.heritages.her${key}`] = {name: game.i18n.localize("SKYFALL.ITEM.LEGACY.HERITAGE")};
				this.document.update( updateData );
			} else if ( create == "benefits" ) {
				const {fieldPath, level} = target.dataset;
				const updateData = {}
				const current = foundry.utils.getProperty(this.document.toObject(), fieldPath);
				if ( !current ) return;
				current.push({type:'grant', granting:'feat', level: level});
				updateData[fieldPath] = current;
				this.document.update( updateData );
			} else if ( create == "ActiveEffect" ) {
				let type = target.closest('section')?.dataset?.type ?? 'base';
				let category = target.dataset.category;
				
				const effectData = {
					type: type,
					name: game.i18n.format("DOCUMENT.Create", {
						type: game.i18n.localize(`TYPES.ActiveEffect.${type}`)
					}),
					img: ['modification'].includes(type) ? 'icons/svg/upgrade.svg' : this.document.img,
					disabled: category == 'inactive',
					duration: category == 'temporary' ? {rounds:1} : {},
				}
				if ( this.document.documentName == 'Actor' ) {
					effectData.name = game.i18n.format("DOCUMENT.Create", {
						type: game.i18n.localize(`TYPES.ActiveEffect.${type}`)
					});
				} else {
					effectData.name = this.document.name;
				}
				this.document.createEmbeddedDocuments( create, [effectData] );
			} else if ( create == "Item" ) {
				let type = target.dataset.type ?? target.closest('section')?.dataset?.type ?? 'base';
				const itemData = {
					type: type,
					name: game.i18n.format("DOCUMENT.Create", {
						type: game.i18n.localize(`TYPES.Item.${type}`)
					}),
				}
				const created = await this.document.createEmbeddedDocuments( create, [itemData] );
				created[0].sheet.render(true);
			}
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static async #onEdit(event, target) {
			const itemId = target.closest("[data-entry-id]")?.dataset.entryId;
			const document = this.document.items?.get(itemId) ?? this.document.effects?.get(itemId) ?? await fromUuid(itemId);
			if ( !document ) return;
			document.sheet.render(true);
		}

		/**
		 * Handle deleting a Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onDelete(event, target) {
			const type = target.dataset.delete;
			const {entryId} = target.closest("[data-entry-id]")?.dataset ?? {};
			const {fieldPath} = target.closest("[data-field-path]")?.dataset ?? {};
			const document = this.document.items?.get(entryId) ?? this.document.effects?.get(entryId);
			if ( type == 'id' || type == 'index' ) {
				const list = foundry.utils.getProperty(this.document, fieldPath);
				
				if ( !list ) return;
				if ( list instanceof Set ) {
					list.find((v, i) => {
						if ( i == entryId || v.id == entryId || v.uuid == entryId ) {
							return list.delete(v);
						} return false;
					});
					//list.delete(entryId) || list.forEach(i=>i.uuid==entryId ? list.delete(i) : i);
				}
				else if (list instanceof Array) list.splice(entryId, 1);
				const updateData = {};
				updateData[fieldPath] = [...list];
				return this.document.update(updateData);
			} else if ( fieldPath ) {
				const updateData = {};
				updateData[`${fieldPath}-=${entryId}`] = null;
				this.document.update(updateData);
			} else if ( document ) {
				this.document.deleteEmbeddedDocuments( document.documentName, [entryId] );
			}
		}

		/**
		 * Handle toggling property value to the document or embeded document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onToggle(event, target) {
			const fieldPath = target.dataset.fieldPath;
			const itemId = target.closest(".entry")?.dataset.entryId;
			if ( this.actor && SYSTEM.conditions[itemId] ) return this.actor.toggleStatusEffect( itemId );
			const document = ( itemId ? (this.document.items?.get(itemId) ?? this.document.effects.get(itemId)) : this.document );
			if ( !foundry.utils.hasProperty(document, fieldPath) ) return;
			const updateData = {};
			updateData[fieldPath] = !foundry.utils.getProperty(document, fieldPath);
			document.update(updateData);
		}

		/**
		 * Handle increasing/descreasing property value to the document or embeded document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onVary(event, target) {
			const fieldPath = target.dataset.fieldPath;
			const max = target.dataset.max;
			const itemId = target.closest(".entry")?.dataset.entryId;
			const document = this.document.items.get(itemId) ?? this.document.effects.get(itemId) ?? this.document;
			if ( !foundry.utils.hasProperty(document, fieldPath) ) return;
			let value = Number(foundry.utils.getProperty(document, fieldPath));
			const updateData = {};
			updateData[fieldPath] = value;
			event.type == 'click' ? updateData[fieldPath]++ : updateData[fieldPath]-- ;
			if ( max && Number(max) ) {
				updateData[fieldPath] = Math.min(updateData[fieldPath], Number(max));
			}
			document.update(updateData);
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static async #onUse(event, target) {
			let id = target.closest('.entry').dataset.entryId;
			if ( event.type == 'click' ) {
				let withId = target.dataset.itemId;
				if ( withId != id ) {}
				const ability = this.actor.items.get(id);
				if ( !ability ) return;
				const item = this.actor.items.get(withId);
				const skipUsageConfig = game.settings.get('skyfall','skipUsageConfig');
				const skip = ( skipUsageConfig=='shift' && event.shiftKey) || ( skipUsageConfig=='click' && !event.shiftKey);
				await ChatMessage.create({
					type: 'usage',
					flags: {
						skyfall: {
							advantage: event.ctrlKey ? 1 : 0,
							disadvantage: event.altKey ? 1 : 0,
						}
					},
					speaker: ChatMessage.getSpeaker({actor: this.actor, token: this.actor.token}),
					system: {
						actorId: this.actor.uuid,
						abilityId: ability.id,
						itemId: item?.id ?? null,
					}}, {skipConfig: skip});
			} else {
				const itemId = target.closest("[data-entry-id]")?.dataset.entryId;
				const document = this.document.items?.get(itemId) ?? this.document.effects?.get(itemId) ?? await fromUuid(itemId);
				if ( !document ) return;
				document.sheet.render(true);
			}
		}
		
		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static async #onAbilityUse(event, target) {
			if ( event.type == 'click' ) {
				let abilityId = target.dataset.abilityId;
				let itemId = target.dataset.entryId;
				console.log(abilityId);
				console.log(itemId);

				let commom = SYSTEM.actions.find( action => action.id == abilityId );
				if ( itemId == abilityId ) return;
				if ( commom ){
					await ChatMessage.create({
						content: `<h5>${game.i18n.localize(commom.name)}</h5>${game.i18n.localize(commom.hint)}`,
						speaker: ChatMessage.getSpeaker({actor: this.actor, token: this.actor.token}),
					});
					return;
				}
				const item = this.actor.items.get(itemId);
				if ( !abilityId && ['weapon','armor'].includes(item?.type) ) {
					const weaponAbilitiesOptions = this.actor.items.filter(i => i.type == 'ability' && i.system.descriptors.includes('weapon')).map( i => 				`<label><input type="radio" name="abilityId" value="${i.id}"><img src="${i.img}" width="20px" height="20px" style="display:inline;"><span style="font-family:SkyfallIcons">${i.system.labels.action.icon}</span> ${i.name}</label><br>` ).join('');
					// `<option value="${i.id}"><img src="${i.img}" width="20px" height="20px" style="display:inline;"><span style="font-family:SkyfallIcons">${i.system.labels.action.icon} ${i.name}</option>`
					//.map(i => [i.id, i.name, i.img, i.system.labels.action.icon]);
					abilityId = await foundry.applications.api.DialogV2.prompt({
						window: { title: "SKYFALL2.DIALOG.SelectAbilityItem" },
						content: weaponAbilitiesOptions, //'<select name="abilityId" autofocus>'+weaponAbilitiesOptions+'</select>',
						ok: {
							label: "SKYFALL2.Confirm",
							callback: (event, button, dialog) => button.form.elements.abilityId.value
						}
					});
				}
				
				
				const ability = this.actor.items.get(abilityId);
				if ( !ability ) return;
				
				const { ModificationConfig } = skyfall.applications;
				const MODCONFIG = await ModificationConfig.fromData({
						actor: this.actor.uuid,
						ability: ability.id,
						weapon: item?.id,
						appliedMods: [],
						effects: ability.effects.filter( e => e.isTemporary),
				});
				MODCONFIG.render(true);


				return;
				const skipUsageConfig = game.settings.get('skyfall','skipUsageConfig');
				const skip = ( skipUsageConfig=='shift' && event.shiftKey) || ( skipUsageConfig=='click' && !event.shiftKey);
				await ChatMessage.create({
					type: 'usage',
					flags: {
						skyfall: {
							advantage: event.ctrlKey ? 1 : 0,
							disadvantage: event.altKey ? 1 : 0,
						}
					},
					speaker: ChatMessage.getSpeaker({actor: this.actor, token: this.actor.token}),
					system: {
						actorId: this.actor.uuid,
						abilityId: ability.id,
						itemId: item?.id ?? null,
					}}, {skipConfig: skip});
			} else {
				const itemId = target.closest("[data-entry-id]")?.dataset.entryId;
				const document = this.document.items?.get(itemId) ?? this.document.effects?.get(itemId) ?? await fromUuid(itemId);
				if ( !document ) return;
				document.sheet.render(true);
			}
		}

		static async #onItemRecharge(event, target) {
			let itemId = target.dataset.entryId;
			const item = this.document.items.get(itemId);
			if ( item.system.reload ) {
				const ammo = this.document.items.get(item.system.consume.target);
				if ( !ammo ) {
					return ui.notifications.error("NOTIFICATIONS.ConsumableNotFound", {
						localize: true
					});
				}
				const realoaded = Math.min(item.system.reload.quantity, ammo.system.quantity);
				item.update({'system.reload.value': realoaded});
				const message = game.i18n.format("Recarregou {item} {actions}", {
					item: item.name,
					actions: "(" + item.system.reload.actions.reduce((acc, i) => {
						if ( acc ) acc += ' + ';
						acc += SYSTEM.icons[`sf${i}`];
						return acc;
					}, '') + ")",
				});
				ChatMessage.create({
					content: message,
				})
				return;
			}
			
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static async #onRoll(event, target) {
			// let target = button.dataset.type;
			const skipUsageConfig = game.settings.get('skyfall','skipUsageConfig');
			const skipConfig = ( skipUsageConfig=='shift' && event.shiftKey) || ( skipUsageConfig=='click' && !event.shiftKey);
			const advantageConfig = (event.altKey ? 1 : (event.ctrlKey ? -1 : 0));

			const id = target.dataset.id;
			const rollType = target.dataset.rollType;
			if ( event.type == 'contextmenu' ) {
				this.rolling = null;
				return this.render(true);
			}
			// rolling {type:"skill|attack|ability|"}
			if ( rollType == 'levelHitDie' ) { return; }
			else if ( rollType == 'healHitDie' ) { return; }
			else if ( rollType == 'deathSave' ) { return; }
			else if ( rollType == 'initiative' ) {
				this.rolling = null;
				const combat = game.combats.active;
				const combatants = combat.combatants.filter(
					(c) => c.actorId === this.actor.id && this.initiative == null
				);
				for (const combatant of combatants) {
					this.actor.rollInitiative();
				}
				return;
			}

			if ( !this.rolling ) {
				if ( rollType == 'ability') this.rolling = {type:null, id:null, abl: id};
				else this.rolling = {type: rollType, id: id, abl: null};
			} else if ( this.rolling.type && rollType !== 'ability' ) {
				this.rolling = {type: rollType, id: id, abl: null};
			} else if ( this.rolling.type && rollType == 'ability' ) {
				this.rolling.abl = id;
			} else {
				this.rolling.type = rollType;
				this.rolling.id = id;
			}
			if ( this.rolling.abl && this.rolling.type && this.rolling.id ) {
				const { ModificationConfig } = skyfall.applications;
				// const ability = SYSTEM.prototypeItems.ABILITYROLL;
				const ability = new Item(SYSTEM.prototypeItems.ABILITYROLL);
				const MODCONFIG = await ModificationConfig.fromData({
						actor: this.actor.uuid,
						ability: ability, //this.actor.items.find( i => i.name == 'ABILITYROLL').id,
						check: this.rolling,
						appliedMods: [],
						effects: [],
				});
				MODCONFIG.render(true);

				// await this.actor.rollCheck(this.rolling, {skipConfig, advantageConfig});
				this.rolling = null;
			}
			this.render(true);
		}

		static #onEditImage(event, target) {
			if (!this.isEditable) return;
			const current = this.document.img;
			const fp = new FilePicker({
				type: "image",
				current: current,
				callback: path => this.document.update({img: path}),
				top: this.position.top + 40,
				left: this.position.left + 10
			});
			fp.browse();
		}
		
		static #onManage(event, target) {
			let manage = target.dataset.manage;
			switch (manage) {
				case "descriptors":
					if ( !game.user.getFlag('skyfall', 'developer') ) return;
					return skyfall.applications.AbilityDescriptorsConfig.prompt({
						document: this.document,
						fieldPath: target.dataset.fieldPath,
					});
				case "modifiers-damage.dealt":
					return;
				case "modifiers-damage.taken":
				case "modifiers-condition.imune":
				case "irv":
					return new skyfall.applications.ActorTraitsV2({
						document: this.actor,
						manage: "irv"
					}).render(true);
				case "resources":
					return new skyfall.applications.ActorResources({
						document: this.actor
					}).render(true);
				case "other":
					// return new TraitSelector(this.actor, options).render(true);
					return;
				case "short-rest":
					return skyfall.applications.RestConfig.prompt({actor: this.actor});
				case "long-rest":
					return this.actor.longRest();
				case "skills":
					return new skyfall.applications.ActorTraitsV2({
						document: this.actor,
						manage: manage
					}).render(true);
				case "movement":
				case "languages":
				case "proficiencies":
				default:
					return new ActorTraits(this.actor, manage).render(true);
			}
		}

		static #onToggleMode(event, target) {
			this._sheetMode = this._sheetMode == 1 ? 0 : 1;
			this.render();
		}

		static #onFilter(event, target) {
			const key = target.dataset.filter;
			const filterId = target.closest('[data-filter-id]').dataset.filterId;
			const filter = this.filters[filterId];
			if ( !filter ) return;
			if ( event.type == 'click' ) {
				filter[key].active = !filter[key].active;
			} else if ( event.type == 'contextmenu' ) {
				if( Object.values(filter).filter(f=> f.active).length == 1 && filter[key].active ) {
					filter[key].active = false;
				} else {
					for (const k of Object.keys(filter)) filter[k].active = false;
					filter[key].active = true;
				}
			}
			if ( Object.values(filter).filter( f => f.active ).length === 0 ) {
				const initial = Object.keys(filter).reduce( (acc, k) => {
					acc[k] = {active: true};
					return acc;
				}, {});
				foundry.utils.mergeObject(filter, initial);
			}
			return this.render();
			if ( this.filters[filterId] == filter ) this.filters[filterId] = null;
			else this.filters[filterId] = filter;
			this.render();
		}
		
		static #onCollapse(event, target) {
			target.closest('.ability-card').classList.toggle('collapsed');
		}
		static #onCollapseAll(event, target) {
			const cards = target.closest('section').querySelectorAll('.ability-card');
			cards.forEach( c => c.classList.add('collapsed'));
		}
		static #onExpandAll(event, target) {
			const cards = target.closest('section').querySelectorAll('.ability-card');
			cards.forEach( c => c.classList.remove('collapsed'));
		}

		static #logToConsole(){
			console.group("LOG DOCUMENT AND SHEET ");
			console.log(this.document);
			console.log(this);
			console.groupEnd()
		}

		static async #convertItem(){
			const doc = this.document;
			const operation = {
				pack: doc.pack
			}
			const itemData = doc.toObject();
			itemData.type = 'consumable';
			
			await doc.delete();

			Item.create(itemData, operation);
		}

		static async #createRoll(event, target){
			const updateData = {};
			updateData[`system.rolls.${randomID(16)}`] = {
				label: 'NEW ROLL',
				type: 'attack',
			}
			this.document.update(updateData);
		}
		static async #deleteRoll(event, target){
			const rollId = target.dataset.rollId;
			const updateData = {};
			updateData[`system.rolls.-=${rollId}`] = null;
			this.document.update(updateData);
		}

		static async #createTerm(event, target){
			const rollId = target.dataset.rollId;
			const keyPath = `system.rolls.${rollId}.terms`;
			const updateData = {};
			const current = foundry.utils.getProperty(this.document.toObject(), keyPath);
			current.push({});
			updateData[keyPath] = current;
			this.document.update(updateData);
		}

		static async #deleteTerm(event, target){
			const rollId = target.dataset.rollId;
			const termIndex = target.dataset.termIndex;
			const keyPath = `system.rolls.${rollId}.terms`;
			const current = foundry.utils.getProperty(this.document.toObject(), keyPath);
			const updateData = {};
			updateData[keyPath] = current.filter( (v, i) => i != termIndex);
			this.document.update(updateData);
		}

		/* ---------------------------------------- */
		/*              EVENT HANDLERS              */
		/* ---------------------------------------- */

		/** @overwrite */
		static async #onSubmitDocumentForm(event, form, formData) {
			const submitData = this._prepareSubmitData(event, form, formData);
			await this.document.update(submitData);
		}
	};
};