
/**
 * Add common functionalities to every Crucible Sheet application which alters their visual style.
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

		abilitySection = false;
		isEditing = false;
		
		/**
		 * Keep what section of ability Sheet is beeing edited
		 * @type {string}
		 */
		/** @inheritDoc */
		static get defaultOptions() {
			return Object.assign(super.defaultOptions, {
				classes: ["skyfall", "sheet", this.documentType],
				template: `systems/${SYSTEM.id}/templates/item/${this.documentType}.hbs`,
				width: "auto",// 520,
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
			const typeLabel = type.titleCase();
			//game.i18n.localize(CONFIG[documentName].typeLabels[type]);
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
			html.on("click", "details", this.#onClickSetPosition.bind(this));
			// Toggle Editing //Edited Tab
			html.on("click", ".isEditing", this.#onClickToggleEditing.bind(this));
			// html.on("click", ".edit-section.active", this.#onClickCloseTab.bind(this));
			// let handler = ev => this._onDragStart(ev);
			html.find('li.draggable').each((i, li) => {
				if (!li.hasAttribute("data-entry-id")) return;
				li.addEventListener("dragstart", this._onDragStart(event), false);
			});
			html.on("click", "[data-action]", this.#onClickControl.bind(this));

			// console.log(x);
			// let x = this.setPosition({width: "auto"});
			// console.log(x);
		}

		#onClickSetPosition(){
			console.log("onClickSetPosition");
			this.setPosition({height: "auto"})
		}

		#onClickToggleEditing(event){
			console.log( this.isEditing );
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

		}

		#onActionVary(button) {

		}

		#onActionManage(button) {

		}

		async #onActionCreate(button) {
			console.log(button);
			const type = button.dataset.type;
			if ( type == "heritage" ) {
				const updateData = {}
				// TODO DIALOG
				const key = Object.keys(this.document.system.heritages).length;
				updateData[`system.heritages.her${key}`] = {name: game.i18n.localize("SKYFALL.ITEM.LEGACY.HERITAGE")};
				console.log(updateData);
				this.document.update( updateData );
			}
		}

		#onActionDelete(button) {
			console.log(button);
			const type = button.closest('ul').dataset.type;
			const target = button.closest('ul').dataset.target;
			const entry = button.closest(".entry").dataset.entryId;
			
			if ( parseUuid(entry) ) { // Uuid Set
				const updateData = {}
				const list = getProperty(this.document, target);
				console.log( type, target, entry, list );
				list.delete(entry);
				updateData[target] = [...list];
				console.log(updateData);
				this.document.update( updateData );
			} else if ( type == "heritage" ) {
			} else {
			}
		}

		#onActionEdit(button) {

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
		_onDragStart(event) {
			console.log("_onDragStart");
		}

		/** @inheritdoc */
		async _onDrop(event) {
			if ( !this.isEditable ) return;
			// Try to extract the data
			const data = TextEditor.getDragEventData(event);
			console.log("_onDrop", [event, data]);
			if ( data.type !== "Item" ) return;
			const item = await fromUuid(data.uuid);
			console.log("item", [event, data, item]);
			if ( !item ) return;
			const parent = event.target.closest("ul");
			const type = parent.dataset.type;
			const target = parent.dataset.target;
			if ( item?.type === type ) {
				const updateData = {};
				const lista = [...getProperty(this.document, target), data.uuid];
				updateData[target] = lista;
				console.log("item", [event, data, item, updateData]);
				this.document.update(updateData);
			};
			if ( item?.type == "other" ) {
				const feats = this.element[0].querySelector(".feats .droppable");
			};

			this.setPosition({height: "auto"});
		}
	}
}
