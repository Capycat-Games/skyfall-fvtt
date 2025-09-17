const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class SkyfallAbilityModificationsConfig extends HandlebarsApplicationMixin(DocumentSheetV2) {

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		classes: ["ability-modification-config", "skyfall"],
		position: {width: 600},
		window: {
			contentClasses: ["standard-form"],
			icon: "fa-solid fa-person-rays"
		},
		form: {
			handler: SkyfallAbilityModificationsConfig.#onSubmitDocumentForm,
			submitOnChange: false,
			closeOnSubmit: true,
		},
		actions: {
			commit: SkyfallAbilityModificationsConfig.#onCommit,
			// addChange: SkyfallAbilityModificationsConfig.#onAddChange,
			// deleteChange: SkyfallAbilityModificationsConfig.#onDeleteChange
		}
	};

	/** @override */
	static PARTS = {
		content: {template: "systems/skyfall/templates/v2/apps/ability-modification-config.hbs"},
		footer: {template: "templates/generic/form-footer.hbs"}
	};

	/** @override */
	async _prepareContext(options) {
		const document = this.document;
		const context = {
			document,
			source: document._source,
			system: document.system,
			actor: document.system.actor,
			ability: document.usage.item,
			modifications: await document.usage.getModifications(),
			rootId: this.id,
			buttons: [{type: "submit", icon: "fa-solid fa-save", label: "EFFECT.Submit"}]
		};
		context._selOpts = {};
		
		return context;
	}

	/* -------------------------------------------- */
	/*  Event Listeners and Handlers                */
	/* -------------------------------------------- */

	/** @inheritDoc */
	_onChangeForm(formConfig, event) {
		super._onChangeForm(formConfig, event);
		
		
	}

	static async #onCommit(event) {
		this.submit();
	}

	/** @inheritdoc */
	static async #onSubmitDocumentForm(event, form, formData) {
		const submitData = this._prepareSubmitData(event, form, formData);
		await this._processSubmitData(event, form, submitData);
	}
}