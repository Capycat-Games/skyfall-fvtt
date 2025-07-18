import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { SkyfallSheetMixin } from "./base.mjs";
const { ItemSheetV2 } = foundry.applications.sheets;
const TextEditor = foundry.applications.ux.TextEditor.implementation;

export default class GuildAbilitySheetSkyfall extends SkyfallSheetMixin(ItemSheetV2) {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["skyfall", "guild-ability", "ability", "item"],
		position: {width: "auto", height: "auto"},
		form: {
			handler: this.#onSubmitDocumentForm,
			submitOnChange: true,
		},
		actions: {
			
		}
	};
	get docType () {
		return this.document?.type ?? ''
	}
	_sheetMode = 1;
	/** @override */
	static PARTS = {
		ability: {
			template: "systems/skyfall/templates/v2/item/guild-ability-card.hbs",
			scrollable: [""],
		},
		configuration: {
			template: "systems/skyfall/templates/v2/item/ability.hbs",
			templates: [
				"templates/generic/tab-navigation.hbs",
				"systems/skyfall/templates/v2/item/ability-config.hbs",
				"systems/skyfall/templates/v2/item/sigil-config.hbs",
				"systems/skyfall/templates/v2/item/guild-ability-config.hbs",
				"systems/skyfall/templates/v2/shared/effects.hbs",
				"systems/skyfall/templates/v2/item/item-deprecated.hbs",
			],
			scrollable: [".scrollable"],
		},
	};

	/** @override */
	static TABS = {
		config: {id: "config", group: "configuration", label: "SKYFALL.CONFIG", cssClass: 'active'},
		effects: {id: "effects", group: "configuration", label: "SKYFALL.TAB.EFFECTS"}
	};

	/** @override */
	tabGroups = {
		configuration: "config"
	};

	
	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		if (this.document.limited) return;
		options.parts = ["ability","configuration"];
	}

	/** @override */
	async _preparePartContext(partId, context) {
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
		this.getDescriptors( context );
		await this.getEnrichedFields(context);
		await this.getModificationsEmbeds(context);
		// console.log(context);
		context.user.isDeveloper = game.user.getFlag('skyfall', 'developer');
		return context;
	}

	/* ---------------------------------------- */
	async getDescriptors(context) {
		context.descriptors = {
			guild: {
				"id": "guild",
				"type": [ "guild" ],
				"label": game.i18n.localize("TYPES.Actor.guild"),
				"hint": game.i18n.localize("TYPES.Actor.guild"),
				"value": true
			},
		};
		for (const abl of ['cunning','knowledge','crafting','reputation']) {
			context.descriptors[abl] = {
				"id": abl,
				"type": [ "guild" ],
				"label": game.i18n.localize(`SKYFALL2.GUILD.${abl.titleCase()}`),
				"hint": game.i18n.localize(`SKYFALL2.GUILD.${abl.titleCase()}`),
				"value": context.system.type == abl
			}
		}
	}

	async getModificationsEmbeds(context){
		const embedded = context.modifications.modification.effects.map( ef => `@Embed[${ef.uuid}]` ).join(' ');
		context.enriched.modifications = await TextEditor.enrichHTML(embedded,{});
	}

	async getEnrichedFields(context){
		const effect = context.system.effect.descriptive;
		if ( effect ) context.enriched.effect = await TextEditor.enrichHTML(effect,{});
	}

	/* ---------------------------------------- */
	/*              EVENT HANDLERS              */
	/* ---------------------------------------- */

	/** @overwrite */
	static async #onSubmitDocumentForm(event, form, formData) {
		const submitData = this._prepareSubmitData(event, form, formData);
		await this.document.update(submitData);
	}
}