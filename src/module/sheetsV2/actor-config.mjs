const { ActorSheetV2 } = foundry.applications.sheets;
const { DocumentSheetV2 } = foundry.applications.api;
import { SkyfallSheetMixin } from "./base.mjs";


/**
 * Extends base ItemSheet with implementing some handlebars configurations;
 * @extends {SkyfallBaseSheet, ActorSheetV2}
 */
export default class ActorConfigurationSheet extends SkyfallSheetMixin(DocumentSheetV2) {
	constructor(options = {}) {
		options.id ??= options.skyfallConfig.schema.name;
		super(options);
		this.#configFieldPath = options.fieldPath;
		this.#skyfallConfigParts = options.skyfallConfigParts;
		this.#entryId = options.id;
	}
	
	#configFieldPath;
	#skyfallConfigParts;
	#entryId;

	/** @override */
	static DEFAULT_OPTIONS = {
		id: "Skyfall-ActorConfigurationSheet.{id}",
		classes: ["standard-form", 'skyfall', 'actor-config', 'sheet'],
		form: {
			handler: this.#onSubmitDocumentForm,
			submitOnChange: true,
		},
		actions: {
			
		},
		position: {
			width: "auto",
			height: "auto",
		},
	};

	static PARTS = {
		initiative: {
			template: "systems/skyfall/templates/v2/apps/actor-initiative.hbs",
			scrollable: [""],
		},
		skill: {
			template: "systems/skyfall/templates/v2/apps/actor-skill.hbs",
			scrollable: [""],
		},
		proficiencies: {
			template: "systems/skyfall/templates/v2/apps/actor-proficiencies.hbs",
			scrollable: [""],
		},
	}

	
	/* ---------------------------------------- */
	/* Getters                                  */
	/* ---------------------------------------- */

	
	get title() {
		const type =  game.i18n.localize(`TYPES.Actor.${this.document.type}`);
		const data = game.i18n.localize(`SKYFALL.Config`);
		return `[${type}] ${data}`;
	}

	/* ---------------------------------------- */
	/* Action Handlers                          */
	/* ---------------------------------------- */
	


	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		if (this.document.limited) return;
		options.parts = this.#skyfallConfigParts ?? [];
	}

	/** @override */
	async _prepareContext(options) {
		const doc = this.document;
		const src = doc.toObject();
		const rollData = doc.getRollData();
		const property = foundry.utils.getProperty(doc, this.#configFieldPath);
		const schema = property.getDataFields;
		const context = {
			SYSTEM: SYSTEM,
			document: doc,
			user: game.user,
			system: doc.system,
			source: src.system,
			property: property, //.toObject(),
			schema: schema,
			_schema: doc.system.schema,
			entryId: this.#entryId,
		}
		return context;
	}


	/** @overwrite */
	static async #onSubmitDocumentForm(event, form, formData) {
		const updateData = foundry.utils.expandObject(formData.object);
		await this.document.update(updateData);
	}
}
