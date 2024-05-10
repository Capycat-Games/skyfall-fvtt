
/**
 * Add common functionalities to every Skyfall Sheet application which alters their visual style.
 * @param {typeof Application} Base     The base Application class being extended
 * @returns {typeof Application}        The extended SkyfallSheet class
 */
export default function SkyfallSheetMixin(Base) {
	return class SkyfallSheet extends Base {

		/**
		 * Declare the document type managed by this SkyfallSheet.
		 * @type {string}
		 */
		static documentType = "";

		/**
		 * Keep what section of ability Sheet is beeing edited
		 * @type {string}
		 */
		abilitySection = false;
		isEditing = false;
		
		/** @inheritDoc */
		static get defaultOptions() {
			return Object.assign(super.defaultOptions, {
				classes: ["skyfall", "sheet"], //, this.documentType
				// template: `systems/${SYSTEM.id}/templates/item/${this.documentType}.hbs`,
				width: 'auto',
				height: 'auto',
				tabs: [
					{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description'},
					{navSelector: '.heritage-tabs', contentSelector: '.heritage-body', initial: 'her0'},
					{navSelector: '.editable-tabs', contentSelector: '.sheet-edit', initial:"traits"},
				],
			});
		}

		/** @override */
		get title() {
			const {documentName, type, name} = this.object;
			// const typeLabel = type.titleCase();
			const typeLabel = game.i18n.localize(`TYPES.Item.${type}`);
			return `[${typeLabel}] ${name}`;
		}

		/* -------------------------------------------- */

		/** @inheritDoc */
		_getHeaderButtons() {
			const buttons = super._getHeaderButtons();
			for ( const button of buttons ) {
				button.tooltip = button.label;
				button.label = "";
			}
			return buttons;
		}

		/* -------------------------------------------- */

		/** @inheritDoc */
		async _renderOuter() {
			const html = await super._renderOuter();
			// const overlaySrc = "systems/crucible/ui/journal/overlay.png"; // TODO convert
			// const overlay = `<img class="background-overlay" src="${overlaySrc}">`
			// html.prepend(overlay);
			return html;
		}

		/* -------------------------------------------- */
		/*  Event Handling                              */
		/* -------------------------------------------- */

		/** @inheritDoc */
		activateListeners(html) {
			super.activateListeners(html);
			
			// Toggle Editing //Edited Tab
			html.on("click", ".isEditing", this.#onClickToggleEditing.bind(this));
			// html.on("click", ".edit-section.active", this.#onClickCloseTab.bind(this));
			// let handler = ev => this._onDragStart(ev);
			// html.find('li.draggable').each((i, li) => {
			// 	if (!li.hasAttribute("data-entry-id")) return;
			// 	li.addEventListener("dragstart", this._onDragStart(event), false);
			// });
			html.on("click", "[data-action]", this.#onClickControl.bind(this));
		}

		#onClickToggleEditing(event){
			this.isEditing = !this.isEditing;
			this.render().setPosition({width: "auto"});
		}

		#onClickCloseTab(event){
			const button = event.currentTarget;
			if ( this.abilitySection == button.dataset.tag ){
				this.abilitySection = 'none';
				const tab = this._tabs.find(t => t._navSelector == ".sheet-card");
				tab.activate('none');
				this.setPosition({width: "auto"});
				return;
			}
			this.abilitySection = button.dataset.tag;
		}

		/* -------------------------------------------- */

		/**
		 * Handle clicks on action button elements.
		 * @param {PointerEvent} event        The initiating click event
		 * @returns {Promise<void>}
		 */
		async #onClickControl(event) {
			event.preventDefault();
			const button = event.currentTarget;
			button.event = event.type; //Pass the trigger mouse click event
			switch ( button.dataset.action ) {
				case "toggle":
					this.#onActionToggle(button);
					break;
				case "vary":
					this.#onActionVary(button);
					break;
				case "manage":
					this.#onActionManage(button);
					break;
				case "create":
					this.#onActionCreate(button);
					break;
				case "delete":
					this.#onActionDelete(button);
					break;
				case "edit":
					this.#onActionEdit(button);
					break;
				case "use":
					this.#onActionUse(button);
					break;
				case "roll":
					this.#onActionRoll(button);
					break;
			}
		}

		/* -------------------------------------------- */

		/**
		 * Handle click events on buttons annotated with [data-action].
		 * @param {string} action         The action being performed
		 * @param {Event} event           The initiating event
		 * @param {HTMLElement} button    The element that was engaged with
		 * @returns {Promise<void>}
		 * @protected
		 */
		async _handleAction(action, event, button) {}

		/* -------------------------------------------- */
		/*  Action Management                           */
		/* -------------------------------------------- */

		#onActionToggle(button) {
			let target = button.dataset.target;
			let id = button.closest('.entry').dataset.entryId;
			let document = this.document.effects.get(id) ?? this.document;
			if ( !target || !id ) return;
			if ( foundry.utils.hasProperty(document, target) ) {
				const updateData = {};
				updateData[target] = !foundry.utils.getProperty(document, target);
				document.update(updateData);
			}
		}

		#onActionVary(button) {

		}

		#onActionManage(button) {

		}

		#onActionUpdate(button) {
			let target = button.dataset.target;
			let id = button.closest('.entry').dataset.entryId;
			let item = this.actor.items.get(id);
			if ( !target || !id || !item ) return;
			let updateData = {};
			updateData[target] = button.value;
			item.update(updateData);
		}

		async #onActionCreate(button) {
			const create = button.dataset.create;
			if ( create == "heritage" ) {
				const updateData = {}
				const key = Object.keys(this.document.system.heritages).length;
				updateData[`system.heritages.her${key}`] = {name: game.i18n.localize("SKYFALL.ITEM.LEGACY.HERITAGE")};
				this.document.update( updateData );
			} else if ( create == "ActiveEffect" ) {
				let type = button.closest('section')?.dataset?.type ?? 'base';
				let category = button.dataset.category;
				const effectData = {
					type: type,
					name: game.i18n.format("DOCUMENT.Create", {
						type: game.i18n.localize(`TYPES.ActiveEffect.${type.titleCase()}`)
					}),
					img: ['modification','sigil'].includes(type) ? 'icons/svg/upgrade.svg' : 'icons/svg/aura.svg',
					disabled: category == 'inactive',
					duration: category == 'temporary' ? {rounds:1} : {},
				}
				this.document.createEmbeddedDocuments( create, [effectData] );
			}
		}

		#onActionDelete(button) {
			const _delete = button.dataset.delete;
			const id = button.closest(".entry").dataset.entryId;

			if ( _delete == 'id' ) {
				const target = button.closest('ul').dataset.target;
				const updateData = {}
				const list = getProperty(this.document, target);
				list.delete(id);
				updateData[target] = [...list];
				this.document.update( updateData );
			} else if ( _delete == 'heritage' ) {
				// TODO
			} else if ( _delete == 'ActiveEffect' ) {
				this.document.deleteEmbeddedDocuments( _delete, [id] );
			}
		}

		#onActionEdit(button) {
			let target = button.dataset.target;
			let id = button.closest('.entry').dataset.entryId;
			let doc;
			if ( !target || !id ) return;
			if ( target == "effect" ) doc = this.document.effects.get(id);
			else doc = this.document.items.get(id);
			if ( !doc ) return;
			doc.sheet.render(true);
		}

		#onActionUse(button) {

		}

		#onActionRoll(button) {

		}

		
		/* -------------------------------------------- */
		/*  Drag & Drop                                 */
		/* -------------------------------------------- */
		/** @inheritdoc */
		_canDragDrop() {
			return this.isEditable;
		}

		/** @override */
		async _onDragStart(event) {
			const li = event.currentTarget;
			if ( li.dataset.entryId ) {
				const entry = await fromUuid( li.dataset.entryId );
				if ( entry ) event.dataTransfer.setData("text/plain", JSON.stringify(entry.toDragData()));
				return;
			}
			
			super._onDragStart(event);
		}

		/** @inheritdoc */
		async _onDrop(event) {
			if ( !this.isEditable ) return;
			// Try to extract the data
			const data = TextEditor.getDragEventData(event);
			if ( data.type !== "Item" ) return;
			const item = await fromUuid(data.uuid);
			if ( !item ) return;
			const parent = event.target.closest("ul");
			const type = parent.dataset.type;
			const target = parent.dataset.target;
			if ( item?.type === type ) {
				const updateData = {};
				const lista = [...getProperty(this.document, target), data.uuid];
				updateData[target] = lista;
				this.document.update(updateData);
			};
			if ( item?.type == "other" ) {
				const feats = this.element[0].querySelector(".feats .droppable");
			};

			this.setPosition({height: "auto"});
		}
	}
}
