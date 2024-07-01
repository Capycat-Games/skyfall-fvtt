import { abilities } from "../config/creature.mjs";
import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { SkyfallSheetMixin } from "./base.mjs";
const { ItemSheetV2 } = foundry.applications.sheets;

export default class AbilitySheetSkyfall extends SkyfallSheetMixin(ItemSheetV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["skyfall", "ability", "item"],
		position: {width: "auto", height: "auto"},
		form: {
			handler: this.#onSubmitDocumentForm,
			submitOnChange: true,
		},
		actions: {
			
		}
	};
	_sheetMode = 1;
	/** @override */
	static PARTS = {
		ability: {template: "systems/skyfall/templates/v2/item/ability-card.hbs"},
		configuration: {
			template: "systems/skyfall/templates/v2/item/ability.hbs",
			templates: [
				"templates/generic/tab-navigation.hbs",
				"systems/skyfall/templates/v2/item/ability-config.hbs",
				"systems/skyfall/templates/v2/shared/effects.hbs",
				"systems/skyfall/templates/v2/shared/effects.hbs"
			]
		},
		// tabs: {template: "templates/generic/tab-navigation.hbs"},
		// config: {template: "systems/skyfall/templates/v2/item/ability-config.hbs", scrollable: [""]},
		// effects: {template: "systems/skyfall/templates/v2/shared/effects.hbs",scrollable: [""]}
	};

	/** @override */
	static TABS = {
		config: {id: "config", group: "configuration", label: "SKYFALL.CONFIG", cssClass: 'active'},
		effects: {id: "effects", group: "configuration", label: "TYPES.ActiveEffect.basePL"}
	};

	/** @override */
	tabGroups = {
		configuration: "config"
	};

	
	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		if (this.document.limited) return;
		
		if ( this.isPlayMode ) {
			options.parts = ["ability"];
		} else {
			options.parts = ["ability","configuration"]//,"tabs","config","effects"];
		}
		console.log(options);
	}

	/** @override */
	async _preparePartContext(partId, context) {
		console.log(partId);
		
		if ( context.tabs[partId] ){
			context.tab = context.tabs[partId];
		} else if ( this.tabGroups[partId] ){
			context.tab = context.tabs[ this.tabGroups[partId] ];
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
			item: doc,
			user: game.user,
			system: doc.system,
			labels: doc.system.labels,
			source: src.system,
			schema: this._getDataFields(),
			SYSTEM: SYSTEM,
			effects: prepareActiveEffectCategories( doc.effects.filter(ef=> ef.type == 'base') ),
			modifications: prepareActiveEffectCategories( doc.effects.filter(ef=> ef.type == 'modification'), 'modification' ),
			enriched: {
				// description: await TextEditor.enrichHTML(doc.system.description.value, enrichmentOptions),
			},
			embeds: {},
			tabs: this._getTabs(),
			isEditMode: this.isEditMode,
			isPlayMode: this.isPlayMode,
			isEditable: this.isEditable,
			isEditing: true, //this.isEditing,
			_selOpts: {},
			_selectOptions: {},
			_app: {
				fields: foundry.applications.fields,
				element: foundry.applications.elements
			}
		};
		this.getDescriptors(context);
		await this.getModificationsEmbeds(context);
		console.log(context);
		return context;
	}

	/* ---------------------------------------- */

	async getModificationsEmbeds(context){
		const embedded = context.modifications.modification.effects.map( ef => `@Embed[${ef.uuid}]` ).join(' ');
		context.enriched.modifications = await TextEditor.enrichHTML(embedded,{});
	}

	/* ---------------------------------------- */
	/*              EVENT HANDLERS              */
	/* ---------------------------------------- */

	/** @overwrite */
	static async #onSubmitDocumentForm(event, form, formData) {
		console.log(formData);
		if ( formData.object["system.components"] ) {
			formData.object["system.components"] = formData.object["system.components"].filter(Boolean);
		}
		const submitData = this._prepareSubmitData(event, form, formData);
		await this.document.update(submitData);
	}
}