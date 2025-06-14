
export default class SkyfallChatMessage extends ChatMessage {
	

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async renderHTML(options={}) {
		const html = await super.renderHTML(options);
		const messageDocs = await this.system.getDocuments();
		const cssClasses = ['skyfall'];
		if ( this.type ) cssClasses.push(this.type);
		if ( messageDocs.actor?.type ) cssClasses.push(messageDocs.actor.type);
		
		if ( this.system.constructor?.metadata?.cssClasses ) {{
			cssClasses.push(this.system.constructor?.metadata?.cssClasses);
		}}
		$(html)[0].classList.add(...cssClasses);

		this.addTokenPortrait(html);
		this.addListeners(html);


		const itemName = html.querySelector('.card-header > .item-name');
		console.log("CHATMESSAGE", itemName);
		if( itemName?.innerText.length <= 10 ) itemName.classList.add("fonts22");
		else if ( itemName?.innerText.length <= 15 ) itemName.classList.add("fonts20");
		else if ( itemName?.innerText.length <= 20 ) itemName.classList.add("fonts18");
		else if ( itemName?.innerText.length <= 25 ) itemName.classList.add("fonts16");
		else if ( itemName?.innerText.length <= 30 ) itemName.classList.add("fonts14");
		else if ( itemName ) itemName.classList.add("fonts12");

		return html;
	}

	/** @inheritdoc */
	addListeners(html) {
		html.querySelectorAll("[data-action]").forEach((button) => {
			button.addEventListener("click", this.#onClickControl.bind(this));
		});
		
		html.querySelectorAll("[data-context-menu]").forEach((element) => {
			control.addEventListener("click", event => {
				event.preventDefault();
				event.stopPropagation();
				const { clientX, clientY } = event;
				event.currentTarget.closest("[data-message-id]").dispatchEvent(new PointerEvent("contextmenu", {
					view: window, bubbles: true, cancelable: true, clientX, clientY
				}));
			});
		});
		
		html.querySelectorAll("[data-apply-rest]").forEach((element) => {
			element.addEventListener("click", this.#applyRest.bind(this));
		});
		html.querySelectorAll("[data-evaluate-roll]").forEach((element) => {
			element.addEventListener("click", this.#evaluateRoll.bind(this));
		});
		html.querySelectorAll("[data-place-template]").forEach((element) => {
			element.addEventListener("click", this.#placeTemplate.bind(this));
		});
		
	}
	
	addTokenPortrait(html){
		if ( this.system.portrait ) {
			const image = document.createElement('img');
			image.src = this.system.portrait;
			image.classList.add('actor-portrait');
			image.width = 28;
			image.heigth = 28;
			//  `<img src="${this.system.portrait}" width=28 heigth=28>`
			html.querySelector(".message-header")?.prepend( image );
		}
	}

	/**
	 * Handle clicks on action button elements.
	 * @param {PointerEvent} event        The initiating click event
	 * @returns {Promise<void>}
	 */
	async #onClickControl(event) {
		// usage.hbs
		event.preventDefault();
		// await this.getDocuments();
		const button = event.currentTarget;
		button.event = event; //Pass the trigger mouse click event
		console.log( button.dataset.action );
		switch ( button.dataset.action ) {
			case "evaluate":
				this.#evaluateRoll(event, button);
				break;
			case "catharsis":
				this.#applyCatharsis(event, button);
				break;
				case "applyDamage":
					this.#applyDamage(event, button);
					break;
			case "placeTemplate":
				this.#placeTemplate(event, button);
				break;
			case "applyEffect":
				const effId = button.dataset.effectId;
				let eff = this.system.effects.find( ef => ef._id == effId );
				for (const tkn of canvas.tokens.controlled) {
					if ( SYSTEM.conditions[eff.id] ) {
						tkn.actor.toggleStatusEffect( eff.id );
					} else {
						tkn.actor.createEmbeddedDocuments('ActiveEffect', [eff]);
					}
				}
				break;
			case "consumeResources":
				// this._onConsumeResources();
				break;
		}
	}


	
	async #applyRest(event, target){
		event.preventDefault();
		const button = event.currentTarget;
		const actorId = button.closest('.rest-card').dataset.actorId;
		const actor = game.actors.get(actorId);
		const messageId = button.closest('.chat-message').dataset.messageId;
		const message = game.messages.get(messageId);
		if ( !actor || actor.isOwnser ) return;
		actor.shortRest(message);
	}
	
	async consumeResources(){
		if ( game.userId != this.author.id ) return;
		const {actor, item} = await this.system.getDocuments();
		const content = ""
		const updateData = {};
		const costs = this.system.costs;
		
		for (const [key, resource] of Object.entries(costs)) {
			switch (key) {
				case 'hp':
					const hp = foundry.utils.getProperty(actor, 'system.resources.hp');
					updateData['system.resources.hp.value'] = hp.value - resource;
					break;
				case 'ep':
					const ep = foundry.utils.getProperty(actor, 'system.resources.ep');
					updateData['system.resources.ep.value'] = ep.value - resource;
					break;
				case 'catharsis':
					const catharsis = foundry.utils.getProperty(actor, 'system.resources.catharsis');
					updateData['system.resources.catharsis.value'] = catharsis.value - resource;
					break;
				case 'shadow':
					const shadow = foundry.utils.getProperty(actor, 'system.resources.shadow');
					updateData['system.resources.shadow.value'] = shadow.value - resource;
					break;
				case 'cunning':
				case 'knowledge':
				case 'crafting':
				case 'reputation':
					if ( resource > 0 ) {
						const ability = foundry.utils.getProperty(actor, `system.abilities.${key}`);
						updateData[`system.abilities.${key}.points`] = ability.points - resource;
					}
					break;
				default:
					// TODO - Potions, Extras
					break;
			}
		}
		if (item.type == "guild-ability") {
			const actions = foundry.utils.getProperty(actor, `system.actions.value`);
			updateData[`system.actions.value`] = actions - item.system.activation.cost;
		}
		// Consumable with uses
		if ( costs.uses ) {
			// updateData['items'] ??= [];
		}
		// Consumable
		if ( costs.quantity ) {
			for (const consumeItem of costs.quantity) {
				const ammo = actor.items.get(consumeItem.id);
				const weapon = actor.items.get(this.system.origin.weapon);
				const currAmmo = foundry.utils.getProperty(ammo, consumeItem.path);
				const currWeaponAmmo = foundry.utils.getProperty(weapon, 'system.reload.value');
				updateData['items'] ??= [];
				if ( !consumeItem.id ) continue;
				updateData['items'].push({
					_id: consumeItem.id,
					[consumeItem.path]: currAmmo + consumeItem.value
				});
				if ( !weapon.id ) continue;
				updateData['items'].push({
					_id: weapon.id,
					'system.reload.value': currWeaponAmmo + consumeItem.value
				});
			}
		}
		// SIGIL
		const sigil = item?.type == "sigil" ? item : null;
		if ( sigil ) { //sigil
			if ( sigil.system.charges.value == 0 ) {
				return ui.notifications.error(
					game.i18n.format("NOTIFICATION.NotEnougthResource", {
						resource: game.i18n.localize("SKYFALL2.RESOURCE.ChargePl"),
					})
				)
			}

			updateData['items'] ??= [];
			updateData['items'].push({
				"_id": sigil.id,
				"system.charges.value": sigil.system.charges.value - 1
			});
		}
		const recharge = item?.type == "ability" ? this._ability : null;
		if ( recharge && actor.type == 'npc' ) {
			updateData['items'] ??= [];
			updateData['items'].push({
				"_id": recharge.id,
				"system.activation.recharge": 0,
			});
			skyfall.ui.sceneConfig.scene.addCatharsis();
		}
		console.warn(updateData);
		actor.update(updateData);

	}

	hasCriticalRoll() {
		return this.rolls.some( r => r.options?.type == "attack"  && r.options?.criticalHit);
	}
	async evaluateAll(){
		const rolls = this.system.rolls;
		console.log(this, rolls);
		for (const [i, roll] of Object.entries(rolls)) {
			console.log(this, roll);
			const critical = roll.options.type == 'damage' && this.hasCriticalRoll();
			await this.evaluateRoll(i, critical);
		}
	}
	
	async evaluateRoll(index, critical = false){
		const message = this;
		const systemRolls = message.system.rolls;
		const messageRolls = [];
		const {actor, item} = await this.system.getDocuments();
		const content = document.createElement('div');
		const rollsDiv = document.createElement('div');
		content.innerHTML = message.content;
		let amplify = 0;
		for await (const [i, roll] of systemRolls.entries()) {
			const r = (roll instanceof SkyfallRoll ? roll : SkyfallRoll.fromData(roll) );
			r.index = i;
			if ( index == i ) {
				if ( r.options.type == 'damage' && critical ) {
					r.alter(2);
				}
				await r.evaluate();
				if ( r.options.type == 'attack' ) {
					const criticalTarget = roll.options.critical?.range ?? 20; 
					if ( r.dice[0].total >= criticalTarget ) {
						message.system.rolls[i].options.criticalHit = true;
					}
					amplify = r.terms[0].total;
					for (const [ii, roll2] of message.system.rolls.entries()) {
						roll2.terms = roll2.terms.filter( t => ((t.options.amplify ?? 0 ) <= amplify) );
						// roll2.formula = roll2.resetFormula();
					}
				} else if ( r.options.type == 'deathsave' && actor ) {
					const death = foundry.utils.getProperty(actor, "system.death");
					if ( death ) {
						const updateData = {}
						if ( r.total >= 10 ) {
							updateData['system.death.success'] = death.success + 1;
						} else {
							updateData['system.death.failure'] = death.failure + 1;
						}
						await actor.update(updateData);
					}
				}
			}
			r.template = await r.render();
			const RolldData = r.toJSON();
			RolldData.template = r.template;
			systemRolls[i] = RolldData;
			if ( r._evaluated ) {
				messageRolls.push(r);
			}
			

			const rdiv = document.createElement('div');
			rdiv.innerHTML = r.template;
			rollsDiv.append(rdiv);
		}
		
		content.querySelectorAll('.modifications .hidden[data-amplify]')
			.forEach( i => Number(i.dataset.amplify) <= amplify ? i.classList.remove('hidden') : null);
		content.querySelector('.rolls').innerHTML = rollsDiv.innerHTML;
		console.log(systemRolls, messageRolls);
		await message.update({
			"content": content.innerHTML,
			"system.rolls": systemRolls,
			"rolls": messageRolls, //rolls.filter( i => i._evaluated ?? i.evaluated),
		});
	}
	
	async #evaluateRoll(event, target){
		event.preventDefault();
		event.stopPropagation();
		const index = target.dataset.roll;
		const critical = target.dataset.critical;
		const messageId = target.closest(".chat-message").dataset.messageId;
		const message = game.messages.get(messageId);
		message.evaluateRoll(index, critical);
	}

	async #applyCatharsis(event, target) {
		event.preventDefault();
		event.stopPropagation();
		let actor;
		if ( !game.user.isGM && canvas.tokens.controlled) {
			actor = game.user.character ?? canvas.tokens.controlled[0]?.actor;
			if ( !actor ) ui.notifications.warn("Nenhum personagem selecionado");
			const current = actor.system.resources.catharsis.value;
			if ( current == 0 ) return ui.notifications.info("Catarse Insuficiente");
			actor.update({"system.resources.catharsis.value": current - 1});
		}

		const button = event.currentTarget;
		button.event = event.type; //Pass the trigger mouse click event
		const operator = button.dataset.catharsis;

		// Update the roll adding the catharsis dice;
		const chatCardId = button.closest(".chat-message").dataset.messageId;
		const rollIndex = button.closest("[data-roll-index]").dataset.rollIndex;
		const message = game.messages.get(chatCardId);
		const roll = message.rolls[rollIndex];
		roll.index = rollIndex;
		await roll.applyCatharsis({operator});
		
		// Update the chat content swapping the modified roll;
		const content = document.createElement('div');
		content.innerHTML = message.content;
		roll.template = await roll.render();
		const template = content.querySelector(`[data-roll-index="${rollIndex}"]`);
		template.outerHTML = roll.template;
		const updateData = {};
		message.rolls.splice(rollIndex, 1, roll);
		updateData['rolls'] = message.rolls;
		updateData['content'] = content.innerHTML;
		if ( !foundry.utils.isEmpty(updateData) ) {
			if ( !game.user.isGM && game.userId != this.author.id ) {
				await skyfall.socketHandler.emit("RollCatharsis", {
					id: message.id,
					updateData: updateData,
				});
				ChatMessage.create({
					content: game.i18n.format("SKYFALL2.MESSAGE.ActorHasGivenCatharsis",{
						actor: actor?.name,
						target: message.alias,
						roll: roll.options.flavor,
						operation: game.i18n.localize(`SKYFALL2.MESSAGE.${operator == '+' ? 'Add' : 'Subtract'}`),
					}),
					speaker: ChatMessage.getSpeaker()
				})
			} else {
				await message.update(updateData);
			}
		}
	}
	
	
	#applyDamage(event) {
		event.preventDefault();
		event.stopPropagation();
		const button = event.currentTarget;
		button.event = event.type; //Pass the trigger mouse click event
		const modifier = Number(button.dataset.damage);
		const chatCardId = button.closest(".chat-message").dataset.messageId;
		const rollIndex = button.closest("[data-roll-index]").dataset.rollIndex;
		const message = game.messages.get(chatCardId);
		const roll =  message.rolls[rollIndex];
		
		for (const token of canvas.tokens.controlled) {
			token.actor.applyDamage( roll , modifier, true );
		}
	}
	
	/**
	* Retrieve AbilityTemplate data and Draw on Canvas
	* @param {Event} event   The originating click event
	* @private
	*/
	async #placeTemplate(event, target) {
		event.preventDefault();
		const button = event.currentTarget;
		const message = this;
		const templates = message.system.measuredTemplate[0] ?? null;
		const shapes = {
			circle: 'circle',
			sphere: 'circle',
			cilinder: 'circle',
			cone: 'cone',
			square: 'square',
			line: 'square',
		}
		if ( !templates ) return;
		const templateData = {
			t: templates[templates.t],
			user: game.user.id,
			distance: templates.distance,
			width: templates.width ?? null,
			direction: 0,
			x: 0,
			y: 0,
			fillColor: game.user.color
		};
		// Return the template constructed from the item data
		const cls = CONFIG.MeasuredTemplate.documentClass;
		const template = new cls(templateData, {parent: canvas.scene});
		const object = new game.skyfall.canvas.AbilityTemplate(template);
		
		// object.item = item;
		// object.actorSheet = item.actor?.sheet || null;
		
		object.drawPreview();
		// template.drawPreview();
		return;
		// if( !item ) return;
		// const template = game.skyfall.canvas.AbilityTemplate.fromItem(item);
		
		// if ( template ) {
		// 	template.drawPreview();
		// }
	}

	
	/* -------------------------------------------- */
	/*  System Methods                              */
	/* -------------------------------------------- */
	

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */
	
	/** @inheritDoc */
	_onUpdate(changed, options, userId) {
		const update =  super._onUpdate(changed, options, userId);
		const initRolls = this.rolls.filter( r => r.options.type == "initiative");
		const combat = game.combats.active;
		if ( initRolls.length > 0 && combat ) {
			const actor = fromUuidSync(this.system?.origin?.actor);
			const combatants = combat.combatants.filter(
				(c) => c.actorId === actor.id && c.initiative == null
			);
			for (const combatant of combatants) {
				const roll = initRolls.pop();
				if ( roll ) {
					combatant.update({
						initiative: roll.total,
					});
				}
			}
		}
		return update;
	}
}