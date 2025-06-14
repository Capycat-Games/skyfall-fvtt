
const { HandlebarsApplicationMixin } = foundry.applications.api;


export default base => {
	return class SkyfallBaseSheet extends HandlebarsApplicationMixin(base) {
		/** @inheritdoc */
		static DEFAULT_OPTIONS = {
			classes: ["skyfallV13"],
			form: {
				submitOnChange: true,
			},
			actions: {
				toggleMode: SkyfallBaseSheet.#onToggleMode,
				editImage: {handler: SkyfallBaseSheet.#onEditImage, buttons: [0, 2]},
				create: SkyfallBaseSheet.#onCreate,
				edit: SkyfallBaseSheet.#onEdit,
				delete: SkyfallBaseSheet.#onDelete,
				toggle: SkyfallBaseSheet.#onToggle,
				vary: {handler: SkyfallBaseSheet.#onVary, buttons: [0, 2]},
				use: {handler: SkyfallBaseSheet.#onUse, buttons: [0, 2]},
				abilityUse: {handler: SkyfallBaseSheet.#onAbilityUse, buttons: [0, 2]},
				itemRecharge: {handler: SkyfallBaseSheet.#onItemRecharge, buttons: [0]},
				roll: {handler: SkyfallBaseSheet.#onRoll, buttons: [0, 2]},
				manage: SkyfallBaseSheet.#onManage,
				filter: {handler: SkyfallBaseSheet.#onFilter, buttons: [0, 2]},
				collapse: SkyfallBaseSheet.#onCollapse,
				collapseAll: SkyfallBaseSheet.#onCollapseAll,
				expandAll: SkyfallBaseSheet.#onExpandAll,
				logToConsole: SkyfallBaseSheet.#logToConsole,
				convertItem: SkyfallBaseSheet.#convertItem,
				createRoll: SkyfallBaseSheet.#createRoll,
				deleteRoll: SkyfallBaseSheet.#deleteRoll,
				createTerm: SkyfallBaseSheet.#createTerm,
				deleteTerm: SkyfallBaseSheet.#deleteTerm,
			}
		};

		/**
		 * Different sheet modes.
		 * @enum {number}
		 */
		static SHEET_MODES = {EDIT: 0, PLAY: 1};

		
		/* ---------------------------------------- */
		/* Getters                                  */
		/* ---------------------------------------- */
		
		get isPlayMode() {
			return this._sheetMode === this.constructor.SHEET_MODES.PLAY;
		}
		
		get isEditMode() {
			return this._sheetMode === this.constructor.SHEET_MODES.EDIT;
		}

		/* ---------------------------------------- */
		/* Rendering                                */
		/* ---------------------------------------- */


		
		/* ---------------------------------------- */
		/* Actions Handlers                         */
		/* ---------------------------------------- */
		
		static #onToggleMode(event, target) {
			this._sheetMode = this._sheetMode == 1 ? 0 : 1;
			this.render(true);
		}

		static #onEditImage(event, target) {
			if (!this.isEditable) return;
			const current = this.document.img;
			const img = event.type == 'click' ? 'img' : 'prototypeToken.texture.src';
			const fp = new FilePicker({
				type: "image",
				current: current,
				callback: path => this.document.update({[img]: path}),
				top: this.position.top + 40,
				left: this.position.left + 10,
			});
			fp.browse();
		}

		/**
		 * Create embedded Document/DataModel;
		 * @param {*} event                            The click event.
		 * @param {*} target                           The element clicked.
		 * @param {string} [target.dataset.create]     Name of the Document/DataModel.
		 * @param {string} [target.dataset.type]       Type of the Document/DataModel.
		 * @param {string} [target.dataset.fieldPath]  DataField fieldPath.
		 * @returns
		 */
		static async #onCreate(event, target) {
			const { create, type, fieldPath } = target.dataset;
			const documentData = this.document.toObject();
			const currentField = foundry.utils.getProperty(documentData, fieldPath);
			
			if ( create == 'Item' ) {
				const itemData = {
					type: type,
					img: CONFIG[create]?.dataModels[type]?.DEFAULT_IMAGE ?? 'icons/svg/item-bag.svg',
					name: game.i18n.format("DOCUMENT.Create", {
						type: game.i18n.localize(`TYPES.Item.${type}`)
					}),
				}
				const created = await this.document.createEmbeddedDocuments( create, [itemData] );
				created[0].sheet.render(true);
			} else if ( create == 'ActiveEffect' ) {
				const category = target.dataset.category;
				const effectData = {
					type: type ?? 'base',
					img: CONFIG[create]?.dataModels[type]?.DEFAULT_IMAGE ?? 'icons/svg/aura.svg',
					disabled: category == 'inactive',
					duration: category == 'temporary' ? { rounds: 1 } : {},
				}
				if ( this.document.documentName == 'Actor' ) {
					effectData.name = game.i18n.format("DOCUMENT.Create", {
						type: game.i18n.localize(`TYPES.ActiveEffect.${type}`)
					});
				} else {
					effectData.name = this.document.name;
				}
				this.document.createEmbeddedDocuments( create, [effectData] );
			} else {
				const datamodel = foundry.utils.getProperty(
					this.document, fieldPath
				);
				const datafield = this.document.system.schema._getField(
					fieldPath.replace('system.','').split('.')
				);
				if ( "_onCreate" in datamodel ) datamodel._onCreate(this.document, target);
				else if ( "_onCreate" in datafield ) datafield._onCreate(this.document, target);
			}
		}

		/**
		 * Open document sheet;
		 * @param {*} event                            The click event.
		 * @param {*} target                           The element clicked.
		 * @param {string} [target.dataset.fieldPath]  DataField fieldPath.
		 * @param {string} [target.dataset.entryId]    Id of the Document/DataModel.
		 * @returns
		 */
		static async #onEdit(event, target) {
			const {entryId, fieldPath} = target.dataset;
			if ( fieldPath ) {
				const property = this._retrieveProperty(fieldPath);
				console.log(property);
				if ( !property ) return;
				else if ( 'sheet' in property.data ) return property.data.sheet;
				else if ( '_onEdit' in property.field ) return property.field._onEdit(
					this.document,
					property.field,
					property.field,
				);
				else if ( 'sheet' in property.field ) return property.field.sheet;
			} else if ( entryId ){
				const document = await this._getHandlerDocument(entryId);
				if ( document ) document.sheet.render(true);
			}

			if ( fieldPath ) {
				const property = foundry.utils.getProperty(this.document, fieldPath);
				
				const datamodel = foundry.utils.getProperty(
					this.document, fieldPath
				);
				const datafield = this.document.system.schema._getField(
					fieldPath.replace('system.','').split('.')
				);
				console.log(property, datamodel, datafield);
				if ( "sheet" in property ) return property.sheet;
				if ( "sheet" in datamodel ) datamodel.sheet;
				else if ( "sheet" in datafield ) {
					console.log(
						{
						document: this.document,
						fieldPath: fieldPath,
						skyfallConfig: {
							schema: datafield,
						},
						skyfallConfigParts: [datafield.name],
					}
					)
					new ActorConfigurationSheet({
						document: this.document,
						fieldPath: fieldPath,
						skyfallConfig: {
							schema: datafield,
						},
						skyfallConfigParts: [datafield.name],
					}).render(true);
				}
				
			} else {
				const document = this.document.items?.get(itemId) ?? this.document.effects?.get(itemId) ?? await fromUuid(itemId);
				if ( !document ) return;
				document.sheet.render(true);
			}
		}

		static #onDelete(event, target) {

		}

		static #onToggle(event, target) {

		}

		static #onVary(event, target) {

		}

		static #onUse(event, target) {

		}

		static #onAbilityUse(event, target) {

		}

		static #onItemRecharge(event, target) {

		}

		static #onRoll(event, target) {

		}

		static #onManage(event, target) {

		}

		static #onFilter(event, target) {

		}

		static #onCollapse(event, target) {

		}

		static #onCollapseAll(event, target) {

		}

		static #onExpandAll(event, target) {

		}

		static #logToConsole(event, target) {

		}

		static #convertItem(event, target) {

		}

		static #createRoll(event, target) {

		}

		static #deleteRoll(event, target) {

		}

		static #createTerm(event, target) {

		}

		static #deleteTerm(event, target) {

		}

		/* -------------------------------------------------- */
		
		_retrieveProperty(fieldPath) {
			const property = {value: null, data: null, field: null};
			const doc = this.document;
			property.data = foundry.utils.getProperty(doc, fieldPath);
			property.value = foundry.utils.getProperty(doc.toObject(), fieldPath);
			property.field = doc.system.schema.getField(fieldPath.replace('system.', ''));
			return property;
		}

		async _getHandlerDocument(id) {
			const document = this.document;
			return	await fromUuid(id) ??
							document.items?.get(id) ??
							document.effects?.get(id) ??
							document;
		}

		/* -------------------------------------------------- */
		/*   Drag and Drop                                    */
		/* -------------------------------------------------- */


		/* -------------------------------------------------- */
		/*   Actor Override Handling                          */
		/* -------------------------------------------------- */


	}


}