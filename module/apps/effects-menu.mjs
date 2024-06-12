const {HandlebarsApplicationMixin, ApplicationV2, DocumentSheetV2} = foundry.applications.api;
/**
 * The UI element which displays the list of Users who are currently playing within the active World.
 * @extends {Application}
 */
/**
export default class EffectsMenu extends Application {
	constructor(token, options) {
		super(options);
		this.token = token;
		game.users.apps.push(this);
	}

	get template() {
		return "templates/apps/image-popout.html";
		// return F:\Foundry\v12\resources\app\templates\apps\image-popout.html
	}

	async getData(){
		console.log(this.token);
		return {};
	}
}
*/

export default class EffectsMenu extends HandlebarsApplicationMixin(DocumentSheetV2) {
	// constructor(token, options) {
	// 	super(options);
	// 	this.document = token.actor;
	// 	game.users.apps.push(this);
	// 	ui.windows[ DEFAULT_OPTIONS ]
	// }

	/** @override */
	static DEFAULT_OPTIONS = {
		id: 'app-effects-menu',
		tag: "div",
		classes: ["skyfall", "effects-menu"],
		position: {
			width: 60, height: "auto",
			top: 50, left: 500
		},
		actions: {
			toggle: {handler: EffectsMenu.#toggle, buttons: [0, 2]},
		}
	};

	/** @override */
	static PARTS = {
		form: {template: "systems/skyfall/templates/v2/apps/effects-menu.hbs"},
	}

	/** @override */
	async _prepareContext(options) {
		const doc = this.document;
		const context = {
			effects: doc.appliedEffects.filter(ef=> ef.type != "modification")
		}
		for (const eff of context.effects ) {
			eff.embed = await TextEditor.enrichHTML(`<div>@Embed[${eff.uuid}]</div>`);
		}
		return context;
	}

	/* ---------------------------------------- */
	/*              EVENT HANDLERS              */
	/* ---------------------------------------- */

	static #toggle(ev) {
		if ( !this.document.id ) return;
		const element = ev.target;
		const effectId = element.dataset.effectId;

		const effect = this.document.effects.get(effectId);
		const statusId = effect.statuses.first() ?? effect.statuses[0];
		if ( !effect ) return;
		const eff = SYSTEM.conditions[ statusId ] ?? effect.toObject(true);
		delete eff._id;

		if ( ev.type === 'click' ) {
			if ( effect.system.group ) {
				this.document.createEmbeddedDocuments("ActiveEffect", [eff]);
			} else if ( effect.system.stack ) { 
				effect.update({"system.stack": effect.system.stack + 1 });
			} else {} // NOTHING
		} else if ( ev.type === 'contextmenu' ) {
			if ( effect.system.stack && effect.system.stack > 1 ) effect.update({"system.stack": effect.system.stack - 1 });
			else effect.delete() //this.document.toggleStatusEffect(effect.statuses[0]);
		}
	};

}