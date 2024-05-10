

export default class AbilityUseConfig extends FormApplication {
	constructor(message, options) {
		super(message, options);
		// this.actor = actor;
		// this.ability = ability;
		// if ( item in options ) this.item = options.item
	}

	/* -------------------------------------------- */

	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["skyfall"],
			width: 400,
			height: "auto"
		});
	}

	/* -------------------------------------------- */

	/** @override */
	get title() {
		return `[ABILITYUSECONFIG] ${this.ability.name}`;
		return `[${game.i18n.localize('SKYFALL.SHEET.ABILITYUSECONFIG')}] ${this.ability.name}`;
	}

	/* -------------------------------------------- */

	get template() {
		return `systems/skyfall/templates/apps/actor-item-create.hbs`;
	}

	/* -------------------------------------------- */

	/** @override */
	async getData(options) {
		const context = {};
		return context;
	}

	/* -------------------------------------------- */

	async getUsageEffects(){
		this.actor.allApplicableModifications();
		// TODO allApplicableModifications from allApplicableEffects With filter Modification
		return;
	}

	/* -------------------------------------------- */

	async _updateObject(event, formData) {
		return;
	}
}