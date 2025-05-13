const {HandlebarsApplicationMixin, DocumentSheetV2} = foundry.applications.api;

export default class ActorTraitsV2 extends HandlebarsApplicationMixin(DocumentSheetV2) {
	constructor(options={}) {
		super(options);
		this.#document = options.document;
		this.manage = options.manage;
	}

	static DEFAULT_OPTIONS = {
		classes: ["skyfall","sheet"],
		sheetConfig: false,
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
			template: "systems/skyfall/templates/v2/apps/actor-traits.hbs",
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};

	/** @override */
	get title() {
		switch (this.manage) {
			case "damage.taken":
			case "condition.imune":
			case "irv":
				return game.i18n.localize("SKYFALL2.APP.IRVConfig");
			case "damage.dealt":
				return game.i18n.localize("SKYFALL2.APP.DamageDealt");
			case "languages":
				return game.i18n.localize("SKYFALL2.APP.Languages");
			case "movement":
				return game.i18n.localize("SKYFALL2.APP.Movement");
			case "proficiencies":
				return game.i18n.localize("SKYFALL2.APP.Proficiencies");
			case "skills":
				return game.i18n.localize("SKYFALL2.APP.NPCSelectSkill");
		}
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
			manage: this.manage,
			schema: this._getDataFields(),
			_app: {
				fields: foundry.applications.fields,
				element: foundry.applications.elements
			},
			buttons: [
				{type: "submit", icon: "fas fa-check", label: "SKYFALL2.Confirm"}
			]
		}
		this._prepareManagedContext(context);
		// console.log(context);
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

	_prepareManagedContext(context){
		switch (this.manage) {
			case "damage.taken":
			case "condition.imune":
			case "irv":
				this.IRVContext(context);
				break;
			case "damage.dealt":
				break;
			case "languages":
				break;
			case "movement":
				break;
			case "proficiencies":
				break;
			case "skills":
				this.skillsContext(context);
				break;
			default:
				break;
		}
	}

	/**
	 * Imunity, Resistance and Vulnerability context
	 * @param {*} context 
	 */
	IRVContext(context){
		const system = this.document.system.toObject(true);
		const damageTaken = system.modifiers.damage.taken;
		context.damageTaken = {};
		
		for ( let [key, damage] of Object.entries(damageTaken) ) {
			let label = SYSTEM.DESCRIPTORS[key]?.label;
			if ( key == 'all' ) label = 'Geral';
			context.damageTaken[key] = {
				rank: damage,
				label: label,
			}
		}
		context.conditionImunity = this.document.system.modifiers.condition.imune;
	}

	damageDealtContext(context){

	}

	languagesContext(context){
		context.languages = {};
		for ( let [key, idioma] of Object.entries(SYSTEM.languages) ) {
			context.languages[key] = {
				value: this.document.system.languages.includes(key),
				label: idioma.label 
			}
		}
	}

	movementContext(context){

	}

	proficienciesContext(context){

	}

	skillsContext(context){
		context.skills = this.document.system.skills;
	}

	/* ----------------------------- */

	/** @overwrite */
	static async #onSubmitDocumentForm(event, form, formData) {
		const submitData = this._prepareSubmitData(event, form, formData);
		await this.document.update(submitData);
	}
}