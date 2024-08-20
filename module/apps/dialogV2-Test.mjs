
const {HandlebarsApplicationMixin, ApplicationV2, DialogV2} = foundry.applications.api;

export default class TestApp extends HandlebarsApplicationMixin(DialogV2) {
	
	/** @inheritDoc */
	static DEFAULT_OPTIONS = {
		id: "dialog-{id}",
		classes: ["dialog"],
		tag: "dialog",
		window: {
			frame: true,
			positioned: true,
			minimizable: false
		},
		actions: {
			add: TestApp.#add,
		}
	};

	/** @override */
	static PARTS = {
		test: {
			template: "systems/skyfall/templates/v2/apps/TestApp.hbs",
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	};
	
	templateData = {
		title: "TESTE",
		listA: [
			{a: "FOO", b: "BAR", c: "FUZ", d: "BUZ"}
		],
		listB: [
			{a: "FOO", b: "BAR", c: "FUZ", d: "BUZ"}
		],
	}

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	_initializeApplicationOptions(options) {
		options = super._initializeApplicationOptions(options);
		return options;
	}

	/** @override */
	async _renderHTML(_context, _options) {
		_context.title = this.templateData.title;
		_context.listA = this.templateData.listA;
		_context.listB = this.templateData.listB;
		_context.buttons = this.options.buttons;
		return super._renderHTML(_context, _options);
	}

	/* -------------------------------------------- */
	/*  Actions                                     */
	/* -------------------------------------------- */

	static #add(event, target) {
		const form = target.closest('dialog').querySelector('form');
		const fd = foundry.utils.expandObject( new FormDataExtended(form).object );
		const fieldPath = target.dataset.fieldPath;
		const data = fd.add[fieldPath];
		fd.result.listA = Object.values(fd.result.listA);
		fd.result.listB = Object.values(fd.result.listB);
		fd.result[fieldPath].push( data );
		this.templateData = fd.result;
		this.render();
	}

	/** @inheritDoc */
	async _onSubmit(target, event) {
		event.preventDefault();
		const form = target.closest('dialog').querySelector('form');
		const fd = new FormDataExtended(form);
		await this.options.submit?.(fd.object);
		return this.close();
		// Default Behavior

		const button = this.options.buttons[target?.dataset.action];
		const result = (await button?.callback?.(event, target, this.element)) ?? button?.action;
		await this.options.submit?.(result);
		return this.close();
	}
}