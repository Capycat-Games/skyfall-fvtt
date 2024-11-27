
export default class SceneConfigSetting extends foundry.abstract.DataModel {
	
	static #settingName = 'sceneConfig';

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const _fields = skyfall.data.fields;
		
		return {
			started: new fields.BooleanField({
				initial: false,
				label: "SKYFALL2.SCENE.Started"
			}),
			catharsis: new fields.NumberField({
				required: true,
				min: 0,
				integer: true,
				initial: 0,
				label: "SKYFALL2.Catharsis"
			}),
		}
	}

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	static init(){
		skyfall.ui.sceneConfig = new skyfall.applications.SceneSettingConfig();
		skyfall.ui.sceneConfig.render(true);
		
		Hooks.on('updateSetting', (setting, data, options, userId) => {
			if ( setting.key != `skyfall.${SceneConfigSetting.#settingName}` ) return;
			skyfall.ui.sceneConfig.render();
			if ( game.userId != userId && game.user.isGM ) {
				skyfall.ui.sceneConfig.rechargeAbility();
			}
		});
	}

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */
	
	async update() {
		// if ( !game.user.isGM ) return;
		await game.settings.set('skyfall', SceneConfigSetting.#settingName, this);
	}

	startScene(){
		if ( !game.user.isGM ) return;
		this.updateSource({
			catharsis: 1,
			started: true,
		});
		this.update();
	}

	endScene(){
		if ( !game.user.isGM ) return;
		this.updateSource({
			catharsis: 0,
			started: false,
		});
		this.update();
	}

	addCatharsis(operator = 1){
		if ( !game.user.isGM ) return;
		this.updateSource({
			catharsis: this.catharsis + (1 * operator),
		});
		this.update();
	}

	async takeCatharsis(){
		if ( !game.users.activeGM ) {
			return ui.notifications.warn('NOTIFICATIONS.NoActiveGM', {localize: true});
		}

		const actor = game.user.character ?? game.canvas.tokens.controlled.pop() ?? false;
		if ( !actor || actor.type != 'character' ) {
			return ui.notifications.warn('NOTIFICATIONS.NoTokensSelected', {localize: true});
		}
		if ( this.catharsis == 0 ) {
			return ui.notifications.warn('SKYFALL2.APP.SCENE.EmptyCatharsis', {localize: true});
		}
		const current = foundry.utils.getProperty(actor.toObject(), 'system.resources.catharsis');
		current.value += 1;
		await actor.update({'system.resources.catharsis.value': current.value});
		skyfall.socketHandler.emit("ReclaimTableCatharsis", 1);
		const message = game.i18n.format('SKYFALL2.APP.SCENE.ReclaimedTableCatharsis', {
			actor: actor.name
		});
		ChatMessage.create({
			content: `<h4>${message}<h4>`,
		});
	}

	async rechargeAbility(){
		if ( !game.user.isGM ) return;
		const foes = game.combat.combatants.reduce( (acc, c) => {
			if ( acc.find( a => a.id == c.actorId ) ) return acc;
			if ( c.isNPC ) acc.push(c.actor);
			return acc;
		}, [] );
		const hasCooldown = [];
		for (const foe of foes) {
			const cooldown = foe.items.filter( i => i.type == 'ability' && i.system.activation.recharge == 0);
			if ( cooldown.length ) {
				hasCooldown.push({
					actor: foe,
					items: cooldown,
				});
			}
		}
		if ( !hasCooldown.length ) {
			return ui.notifications.warn("NoneCooldownAbilities");
		}
		const template = await renderTemplate('systems/skyfall/templates/v2/apps/recharge-dialog.hbs', {
			actors: hasCooldown,
		} );
		const { DialogV2 } = foundry.applications.api;
		const uuid = await DialogV2.prompt({
			window: {
				title: 'SKYFALL2.APP.SCENE.RechargeAbility',
			},
			content: template,
			ok: {
				callback: (event, button, dialog) => button.form.elements.recharge.value
			}
		});
		const item = await fromUuid(uuid);
		await item.update({'system.activation.recharge': 1});
		const message = game.i18n.format('SKYFALL2.APP.SCENE.RechargedAbility', {
			actor: item.actor.name,
			item: item.name,
		});
		ChatMessage.create({
			content: `<h4>${message}<h4>`,
			whisper: [game.user.id],
		});
	}
	// updateSetting
}
