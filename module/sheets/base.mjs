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
 * @param {*} Base                        The base class.
 * @returns {DocumentSheet}      Extended class.
 */
export const SkyfallSheetMixin = Base => {
	const {HandlebarsApplicationMixin} = foundry.applications.api;
	return class SkyfallBaseSheet extends HandlebarsApplicationMixin(Base) {

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
				editImage: SkyfallBaseSheet.#onEditImage,
				// toggleSheet: this._onToggleSheet,
				// toggleOpacity: this._ontoggleOpacity,
				// toggleEffect: this._onToggleEffect,
				// editEffect: this._onEditEffect,
				// deleteEffect: this._onDeleteEffect,
				// createEffect: this._onCreateEffect,
				// toggleDescription: this._onToggleDescription,
				create: SkyfallBaseSheet.#onCreate,
				edit: SkyfallBaseSheet.#onEdit,
				delete: SkyfallBaseSheet.#onDelete,
				toggle: SkyfallBaseSheet.#onToggle,
				vary: SkyfallBaseSheet.#onVary,
				use: SkyfallBaseSheet.#onUse,
				roll: SkyfallBaseSheet.#onRoll,
			}
		};

		/**
		 * The current sheet mode.
		 * @type {number}
		 */
		_sheetMode = this.constructor.SHEET_MODES.EDIT;

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

			this._setupDragAndDrop();
		}

		/** @override */
		_syncPartState(partId, newElement, priorElement, state) {
			super._syncPartState(partId, newElement, priorElement, state);
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
				dragSelector: "[data-entry-id] .wrapper",
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
			const uuid = event.currentTarget.closest("[data-entry-id]").dataset.itemUuid;
			const item = await fromUuid(uuid);
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
			if (item.documentName !== "Item") return;
			const self = target.closest("[data-tab]")?.querySelector(`[data-entry-id="${item.uuid}"]`);
			if (!self || !target.closest("[data-entry-id]")) return;

			let sibling = target.closest("[data-entry-id]") ?? null;
			if (sibling?.dataset.itemUuid === item.uuid) return;
			if (sibling) sibling = await fromUuid(sibling.dataset.itemUuid);

			let siblings = target.closest("[data-tab]").querySelectorAll("[data-entry-id]");
			siblings = await Promise.all(Array.from(siblings).map(s => fromUuid(s.dataset.itemUuid)));
			siblings.findSplice(i => i === item);

			let updates = SortingHelpers.performIntegerSort(item, {target: sibling, siblings: siblings, sortKey: "sort"});
			updates = updates.map(({target, update}) => ({_id: target.id, sort: update.sort}));
			this.document.updateEmbeddedDocuments("Item", updates);
		}

		/* ---------------------------------------- */
		/*              EVENT HANDLERS              */
		/* ---------------------------------------- */

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onCreate(){
			console.log(this.document);
			switch (this.document.documentName) {
				case "Item":
				case "Actor":
				case "ActiveEffect":
					
					break;
			
				default:
					break;
			}
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onEdit(){
			switch (this.document.documentName) {
				case "Item":
				case "Actor":
				case "ActiveEffect":
					
					break;
			
				default:
					break;
			}
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onDelete(){
			switch (this.document.documentName) {
				case "Item":
				case "Actor":
				case "ActiveEffect":
					
					break;
			
				default:
					break;
			}
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onToggle(){
			switch (this.document.documentName) {
				case "Item":
				case "Actor":
				case "ActiveEffect":
					
					break;
			
				default:
					break;
			}
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onVary(){
			switch (this.document.documentName) {
				case "Item":
				case "Actor":
				case "ActiveEffect":
					
					break;
			
				default:
					break;
			}
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onUse(){
			switch (this.document.documentName) {
				case "Item":
				case "Actor":
				case "ActiveEffect":
					
					break;
			
				default:
					break;
			}
		}

		/**
		 * Handle creating new Embbeded Document or Property to the document.
		 * @param {Event} event             The initiating click event.
		 * @param {HTMLElement} target      The current target of the event listener.
		 */
		static #onRoll(){
			switch (this.document.documentName) {
				case "Item":
				case "Actor":
				case "ActiveEffect":
					
					break;
			
				default:
					break;
			}
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

		/** @overwrite */
		static async #onSubmitDocumentForm(event, form, formData) {
			console.log(formData);
			const submitData = this._prepareSubmitData(event, form, formData);
			await this.document.update(submitData);
		}
	};
};