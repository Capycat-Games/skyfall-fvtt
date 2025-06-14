const {HandlebarsApplicationMixin, ApplicationV2, DocumentSheetV2} = foundry.applications.api;

export default class SceneSettingConfig extends HandlebarsApplicationMixin(ApplicationV2) {
	constructor(options) {
		super(options);
		this.#setScene();
	}

	/** @override */
	static DEFAULT_OPTIONS = {
		id: 'app-scene-control',
		tag: "div",
		window: {
			title: "SKYFALL2.APP.Scene",
			frame: true,
			positioned: true,
			minimizable: false,
			closable: false,
		},
		classes: ["skyfall", "sheet", "scene-control"],
		position: {
			width: 200, height: "auto",
			top: 220, left: 120,
		},
		actions: {
			startScene: {handler: SceneSettingConfig.#startScene, buttons: [0]},
			endScene: {handler: SceneSettingConfig.#endScene, buttons: [0]},
			addCatharsis: {handler: SceneSettingConfig.#addCatharsis, buttons: [0]},
			takeCatharsis: {handler: SceneSettingConfig.#takeCatharsis, buttons: [0]},
			rechargeAbility: {handler: SceneSettingConfig.#rechargeAbility, buttons: [0]},
		},
	};

	/** @override */
	static PARTS = {
		form: {
			template: "systems/skyfall/templates/v2/apps/scene-control.hbs"
		},
		footer: {
			template: "systems/skyfall/templates/v2/shared/form-footer.hbs"
		}
	}

	async _renderFrame(options) {
		const frame = await super._renderFrame(options);
		const buttom = frame.querySelectorAll('button');
		for (const btn of buttom) btn.classList.add('hidden');
		return frame;
	}

	/** @override */
	async _prepareContext(options) {
		const context = {
			SYSTEM: SYSTEM,
			scene: this.scene,
			catharsis: Array.fromRange(this.scene.catharsis, 1),
			user: game.user,
			buttons: [],
		}
		if ( game.user.isGM ) {
			context.buttons = [
				{ type: 'button', action: 'addCatharsis',
					icon: 'fa-solid fa-plus',
					tooltip: 'SKYFALL2.APP.SCENE.AddCatharsis', 
				},
				{ type: 'button', action: 'startScene',
					icon: 'fa-solid fa-clapperboard',
					tooltip: 'SKYFALL2.APP.SCENE.Start'
				},
				{ type: 'button', action: 'endScene',
					icon: 'fa-solid fa-clapperboard', //<i class="fa-solid fa-clapperboard"></i>
					tooltip: 'SKYFALL2.APP.SCENE.End'
				},
				{ type: 'button', action: 'rechargeAbility',
					icon: 'fa-regular fa-hourglass', //'<i class="fa-regular fa-hourglass"></i>',
					tooltip: 'SKYFALL2.APP.SCENE.RechargeAbility'
				},
			];
			if ( this.scene.started ) context.buttons.splice(1,1);
			else context.buttons = context.buttons.slice(1,2);
		} else if ( this.scene.started ) {
			context.buttons.push({ type: 'button', action: 'takeCatharsis',
				label: 'SKYFALL2.APP.SCENE.TakeCatharsis'
			});
		}
		return context;
	}

	#setScene() {
		this.scene = game.settings.get('skyfall', 'sceneConfig');
		// this.object = this.scene;
	}
	async close(options) {}

	async render(options={}, _options={}) {
		this.#setScene();
		return await super.render(options, _options);
	}

	/* ---------------------------------------- */
	/*              EVENT HANDLERS              */
	/* ---------------------------------------- */
	
	static async #startScene() {
		await this.scene.startScene();
		this.render();
	}

	static async #endScene() {
		await this.scene.endScene();
		this.render();
	}

	static async #addCatharsis() {
		await this.scene.addCatharsis();
		this.render();
	}

	static async #takeCatharsis() {
		await this.scene.takeCatharsis();
		this.render();
	}

	static async #rechargeAbility() {
		await this.scene.rechargeAbility();
		await this.render();
	}
	
}