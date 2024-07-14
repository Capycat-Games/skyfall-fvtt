import ActorTraits from "../apps/actor-traits.mjs";
import ActorTraitsV2 from "../apps/actor-traitsV2.mjs";

import ShortRestV2 from "../apps/restV2.mjs";
import ShortRest from "../apps/short-rest.mjs";
import { SYSTEM } from "../config/system.mjs";
import { weapons } from "../config/types.mjs";
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
				use: BaseSheetSkyfall.#onUse,
				abilityUse: BaseSheetSkyfall.#onAbilityUse,
				roll: {handler: BaseSheetSkyfall.#onRoll, buttons: [0, 2]},
				manage: BaseSheetSkyfall.#onManage,
				filter: {handler: BaseSheetSkyfall.#onFilter, buttons: [0, 2]},
				collapse: BaseSheetSkyfall.#onCollapse,
				logToConsole: BaseSheetSkyfall.#logToConsole,
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
			if ( this.document.documentName == "Actor" ) this._getPlayMode();
			this._setupDragAndDrop();
		}

		_getPlayMode(){
			const tabs = this.element.querySelector("nav.tabs");
			const toggleMode = document.createElement("a");
			toggleMode.classList = "toggle-mode";
			toggleMode.dataset.action = "toggleMode";
			toggleMode.innerHTML = ( this._sheetMode ? `<i class="fa-solid fa-lock"></i>` : `<i class="fa-solid fa-lock-open"></i>` );
			// toggleMode.append(( this._sheetMode ? `<i class="fa-solid fa-lock-open"></i>` : `<i class="fa-solid fa-lock"></i>` ));
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
				if (e.type == 'modification') categories.modification.effects.push(e);
				else if (e.disabled) categories.inactive.effects.push(e);
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
			new ContextMenu(this.element, '.window-content .class', [], {
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

			// Disallow dropping invalid document types.
			if (!Object.keys(this.document.constructor.metadata.embedded).includes(type)) return;

			// If dropped onto self, perform sorting.
			if (item.parent === this.document) return this._onSortItem(item, target);

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
			} if ( create == "heritage" ) {
				const updateData = {}
				const key = Object.keys(this.document.system.heritages).length;
				updateData[`system.heritages.her${key}`] = {name: game.i18n.localize("SKYFALL.ITEM.LEGACY.HERITAGE")};
				this.document.update( updateData );
			} else if ( create == "ActiveEffect" ) {
				let type = target.closest('section')?.dataset?.type ?? 'base';
				let category = target.dataset.category;
				const effectData = {
					type: type,
					name: game.i18n.format("DOCUMENT.Create", {
						type: game.i18n.localize(`TYPES.ActiveEffect.${type}`)
					}),
					img: ['modification'].includes(type) ? 'icons/svg/upgrade.svg' : 'icons/svg/aura.svg',
					disabled: category == 'inactive',
					duration: category == 'temporary' ? {rounds:1} : {},
				}
				this.document.createEmbeddedDocuments( create, [effectData] );
			} else if ( create == "Item" ) {
				let type = target.closest('section')?.dataset?.type ?? 'base';
				const itemData = {
					type: type,
					name: game.i18n.format("DOCUMENT.Create", {
						type: game.i18n.localize(`TYPES.Item.${type}`)
					}),
				}
				this.document.createEmbeddedDocuments( create, [itemData] );
			}
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onEdit(event, target) {
			const itemId = target.closest("[data-entry-id]")?.dataset.entryId;
			const document = this.document.items?.get(itemId) ?? this.document.effects?.get(itemId);
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
			const itemId = target.closest("[data-entry-id]")?.dataset.entryId;
			const fieldPath = target.closest("[data-field-path]")?.dataset.fieldPath;
			const document = this.document.items?.get(itemId) ?? this.document.effects?.get(itemId);
			if ( type == 'id' ) {
				const list = foundry.utils.getProperty(this.document, fieldPath);
				if ( !list ) return;
				list.delete(itemId);
				const updateData = {};
				updateData[fieldPath] = [...list];
				return this.document.update(updateData);
			}
			if ( fieldPath ) {
				const updateData = {};
				updateData[`${fieldPath}-=${itemId}`] = null;
				this.document.update(updateData);
			} else if ( document ) {
				this.document.deleteEmbeddedDocuments( document.documentName, [itemId] );
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
			const itemId = target.closest(".entry")?.dataset.entryId;
			const document = this.document.items.get(itemId) ?? this.document.effects.get(itemId) ?? this.document;
			if ( !foundry.utils.hasProperty(document, fieldPath) ) return;
			
			const updateData = {};
			updateData[fieldPath] = Number(foundry.utils.getProperty(document, fieldPath));
			event.type == 'click' ? updateData[fieldPath]++ : updateData[fieldPath]-- ;
			document.update(updateData);
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static async #onUse(event, target) {
			let id = target.closest('.entry').dataset.entryId;
			
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
				speaker: ChatMessage.getSpeaker({actor: this}),
				system: {
					actorId: this.actor.uuid,
					abilityId: ability.id,
					itemId: item?.id ?? null,
				}}, {skipConfig: skip});
		}
		
		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static async #onAbilityUse(event, target) {
			let abilityId = target.dataset.abilityId;
			let itemId = target.dataset.entryId;
			let commom = SYSTEM.actions.find( action => action.id == abilityId );
			if ( itemId == abilityId ) return;
			if ( commom ){
				await ChatMessage.create({
					content: `<h5>${game.i18n.localize(commom.name)}</h5>${game.i18n.localize(commom.hint)}`,
					speaker: ChatMessage.getSpeaker({actor: this}),
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
				speaker: ChatMessage.getSpeaker({actor: this}),
				system: {
					actorId: this.actor.uuid,
					abilityId: ability.id,
					itemId: item?.id ?? null,
				}}, {skipConfig: skip});
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
				return this.actor.rollInitiative();
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
				await this.actor.rollCheck(this.rolling, {skipConfig, advantageConfig});
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
				case "modifiers-damage.dealt":
					return;
				case "modifiers-damage.taken":
				case "modifiers-condition.imune":
				case "irv":
					return new ActorTraitsV2({document: this.actor, manage: "irv"}).render(true);
					// manage = manage.split('-')[1];
					// return new ActorTraits(this.actor, manage).render(true);
					// manage = manage.split('-')[1];
					// return new ActorTraits(this.actor, manage).render(true);
				case "other":
					// return new TraitSelector(this.actor, options).render(true);
					return;
				case "short-rest":
					// return new ShortRestV2({actor: this.actor}).render(true);
					return new ShortRest(this.actor, {actor: this.actor}).render(true);
				case "long-rest":
					return this.actor.longRest();
				case "skills":
					return new ActorTraitsV2({document: this.actor, manage: manage}).render(true);
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

		static #logToConsole(){
			console.group("LOG DOCUMENT AND SHEET ");
			console.log(this.document);
			console.log(this);
			console.groupEnd()
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