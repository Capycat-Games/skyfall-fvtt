
const {HandlebarsApplicationMixin, DialogV2} = foundry.applications.api;

export default class AbilityDescriptorsConfig extends HandlebarsApplicationMixin(DialogV2) {
	constructor(options){
		// options.window.title = "SKYFALL2.APP.Rest";
		super(options);
		this.document = options.document;
		this.fieldPath = options.fieldPath;
		this.current = foundry.utils.getProperty(this.document, this.fieldPath);
		if ( !Array.isArray(this.current) ) {
			return ui.notifications.error('SKYFALL2.NOTIFICATION.InvalidPath', {
				localize: true,
			});
		}
		this.descriptors = game.settings.get('skyfall', 'abilityDescriptors').typeDescriptors;
	}

	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		id: "descriptors-config",
		classes: ["dialog","skyfall", "sheet", "descriptors-config"],
		tag: "dialog",
		window: {
			title: "SKYFALL2.APP.DescriptorsConfig",
			frame: true,
			positioned: true,
			minimizable: false
		},
		position: {
			width: 500,
			height: "auto"
		},
		buttons: [
			{
				type: "submit", action: "ok", label: "Confirm", default: true,
				callback: (event, button, dialog) => button.form.elements.descriptors.value
			},
		],
	};

	/** @override */
	static PARTS = {
		rest: {
			template: "systems/skyfall/templates/v2/apps/descriptors-config.hbs",
			scrollable: [".dialog-content"],
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};
	
	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	_initializeApplicationOptions(options) {
		options = super._initializeApplicationOptions(options);
		return options;
	}

	/** @override */
	async _renderHTML(_context, _options) {
		_context.actor = this.actor;
		_context.current = this.current;
		_context.descriptors = this.descriptors;

		_context.buttons = this.options.buttons;
		const form = await super._renderHTML(_context, _options);
		return form;
	}

	/* -------------------------------------------- */
	/*  Actions                                     */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _onSubmit(target, event) {
		event.preventDefault();
		const descriptors = [...target.closest('dialog').querySelectorAll('input[type="checkbox"]:checked')].map( i => i.value);
		const updateData = {}
		updateData[this.fieldPath] = descriptors;
		this.document.update(updateData);
		return this.close();
	}
}