const {HandlebarsApplicationMixin, DocumentSheetV2} = foundry.applications.api;

export default class ActorResources extends HandlebarsApplicationMixin(DocumentSheetV2) {
	constructor(options={}) {
		super(options);
		this.#document = options.document;
		this.manage = options.manage;
	}

	static DEFAULT_OPTIONS = {
		classes: ["skyfall","sheet"],
		sheetConfig: false,
		position: {
			width: 400,
		},
		form: {
			handler: this.#onSubmitDocumentForm,
			submitOnChange: false,
			closeOnSubmit: true
		}
	}

	#document;

	/** @override */
	static PARTS = {
		form: {
			template: "systems/skyfall/templates/v2/apps/actor-resources.hbs",
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};

	/** @override */
	get title() {
		return game.i18n.localize("SKYFALL2.APP.ActorResourcesConfig");
	}

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		if (this.document.limited) return;
		options.parts = ["form", "footer"];
	}

	/** @override */
	async _prepareContext(_options={}) {
		const context = {
			SYSTEM: SYSTEM,
			system: this.document.system.toObject(),
			schema: this._getDataFields(),
			_app: {
				fields: foundry.applications.fields,
				element: foundry.applications.elements
			},
			buttons: [
				{type: "submit", icon: "fas fa-check", label: "SKYFALL2.Confirm"}
			]
		}
		this._prepareSystem(context);
		return context;
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

	_prepareSystem(context){
		const levelRoll = context.system.modifiers.hp.levelRoll;
		context.system.modifiers.hp.levelRoll = levelRoll.reduce( (acc, v, i) => {
			acc[i+1] = v;
			return acc;
		}, {});
	}
	/* ----------------------------- */

	/** @overwrite */
	static async #onSubmitDocumentForm(event, form, formData) {
		const object = foundry.utils.expandObject( formData.object );
		object.hp.levelRoll = Object.values( object.hp.levelRoll );
		object.hp.levelRoll[0] = 0;
		const updateData = {
			"system.modifiers.hp": {
				abilities: object.hp.abilities.filter(Boolean),
				levelRoll: object.hp.levelRoll,
				levelExtra: [ object.hp.levelExtra ?? 0 ],
				totalExtra: [ object.hp.totalExtra ?? 0 ],
			},
			"system.modifiers.ep": {
				levelExtra: [ object.ep.levelExtra ?? 0 ],
				totalExtra: [ object.ep.totalExtra ?? 0 ],
			}
		}
		await this.document.update( updateData );
	}
}