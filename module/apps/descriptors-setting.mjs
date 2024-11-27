const {HandlebarsApplicationMixin, ApplicationV2} = foundry.applications.api;

export default class AbilityDescriptorsSetting extends HandlebarsApplicationMixin(ApplicationV2) {
	constructor(options) {
		super(options);
		this.setting = game.settings.get('skyfall', 'abilityDescriptors');
	}

	setting;

	/** @override */
	static DEFAULT_OPTIONS = {
		id: 'setting-ability-descriptors',
		tag: "form",
		form: {
      handler: AbilityDescriptorsSetting.#onSubmit,
      closeOnSubmit: true
    },
		window: {
			title: "SKYFALL2.SETTING.AbilityDescriptors",
			frame: true,
			positioned: true,
		},
		classes: ["skyfall", "sheet", "ability-descriptors"],
		position: {
			width: 600, height: 600,
			// top: 220, left: 120,
		},
		actions: {
			create: {handler: AbilityDescriptorsSetting.#create, buttons: [0]},
			delete: {handler: AbilityDescriptorsSetting.#delete, buttons: [0]},
		},
	};

	/** @override */
	static PARTS = {
		tabs: {
			template: "templates/generic/tab-navigation.hbs"
		},
		descriptors: {
			id: "descriptors",
			template: "systems/skyfall/templates/v2/apps/descriptors-setting.hbs",
			scrollable: [""],
		},
		base: {
			template: "systems/skyfall/templates/v2/apps/descriptors-setting.hbs",
			scrollable: [""],
		},
		custom: {
			template: "systems/skyfall/templates/v2/apps/descriptors-setting.hbs",
			scrollable: [""],
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	}

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */
	
	/** @override */
	async _preparePartContext(partId, context) {
		context.tab = context.tabs[partId];
		return context;
	}

	/** @override */
	_configureRenderOptions(options) {
		super._configureRenderOptions(options);
		options.parts = ["tabs", "descriptors", "base", "custom", "footer"];
		return;
	}

	#getTabs() {
		const tabs = {
			descriptors: {
				id: "descriptors", group: "form",
				label: "SKYFALL2.DescriptorPL", cssClass: 'active'
			},
			base: {
				id: "base", group: "form",
				label: "SKYFALL2.Skyfall"
			},
			custom: {
				id: "custom", group: "form",
				label: "SKYFALL2.Custom"
			},
		}
		
		for ( const v of Object.values(tabs) ) {
			v.active = this.tabGroups[v.group] === v.id;
			v.cssClass = v.active ? "active" : "";
		}
		return tabs;
	}

	/** @override */
	async _prepareContext(options) {
		const context = {
			SYSTEM: SYSTEM,
			descriptors: this.setting.typeDescriptors,
			setting: this.setting,
			custom: this.setting.base,
			custom: this.setting.custom,
			user: game.user,
			tabs: this.#getTabs(),
			buttons: [
				{type: "submit", icon: "fa-solid fa-save", label: "PERMISSION.Submit"}
			],
		}
		return context;
	}

	/* ---------------------------------------- */
	/*              EVENT HANDLERS              */
	/* ---------------------------------------- */
	
	static async #create(event, target) {
		const input = target.closest('.controls').querySelector('input').value;
		if ( !input ) return;
		if ( this.setting.base.find( i => i.id == input ) ) return;
		if ( this.setting.custom.find( i => i.id == input ) ) return;
		const setting = this.setting.toObject();
		setting.custom.push({
			id: input,
			type: "origin",
			label: input,
			hint: "",
		});
		await game.settings.set("skyfall", "abilityDescriptors", setting );
		this.setting = await game.settings.get('skyfall', 'abilityDescriptors');
		this.render();
	}

	static async #delete(event, target) {
		const descriptorId = target.dataset.id;
		const setting = this.setting.toObject();
		setting.custom.findSplice( i => i.id == descriptorId );
		await game.settings.set("skyfall", "abilityDescriptors", setting );
		this.setting = await game.settings.get('skyfall', 'abilityDescriptors');
		console.log(descriptorId, setting, this.setting);
		this.render();
	}
	

	static async #onSubmit(event, form, formData) {
		console.log(event);
		console.log(form);
		console.log(formData);
		return;
	}
}