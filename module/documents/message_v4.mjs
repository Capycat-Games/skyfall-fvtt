import D20Roll from "../dice/d20-roll.mjs";
import SkyfallRoll from "../dice/skyfall-roll.mjs";

export default class SkyfallMessage extends ChatMessage {
	
	async getHTML() {
		console.log('getHTML', this);
		let html = await super.getHTML();
		const messageDocs = await this.system.getDocuments();
		if ( this.system.portrait ) {
			let image = document.createElement('img');
			image.src = this.system.portrait;
			image.classList.add('actor-portrait');

			$(html).find('.message-header').prepend( `<img src="${this.system.portrait}" width=28 heigth=28>` );
		}
		const cssClasses = ['skyfall'];
		if ( this.type ) cssClasses.push(this.type);
		if ( messageDocs.actor?.type ) cssClasses.push(messageDocs.actor.type);
		
		if ( this.system.constructor?.metadata?.cssClasses ) {{
			cssClasses.push(this.system.constructor?.metadata?.cssClasses);
		}}
		$(html)[0].classList.add(...cssClasses);
		
		this.activateListeners(html);

		const itemName = html.find('.card-header > .item-name');
		if( itemName.text().length <= 10 ) itemName.addClass("fonts22");
		else if ( itemName.text().length <= 15 ) itemName.addClass("fonts20");
		else if ( itemName.text().length <= 20 ) itemName.addClass("fonts18");
		else if ( itemName.text().length <= 25 ) itemName.addClass("fonts16");
		else if ( itemName.text().length <= 30 ) itemName.addClass("fonts14");
		else itemName.addClass("fonts12");

		return html;
	}

	/** @inheritDoc */
	activateListeners(html) {

		html.on("click", "[data-action]", this.#onClickControl.bind(this));

		for ( const control of $(html).find("[data-context-menu]") ) {
			control.addEventListener("click", event => {
				event.preventDefault();
				event.stopPropagation();
				const { clientX, clientY } = event;
				event.currentTarget.closest("[data-message-id]").dispatchEvent(new PointerEvent("contextmenu", {
					view: window, bubbles: true, cancelable: true, clientX, clientY
				}));
			});
		}
		// html.find('.aid').click(this._dealDamageClicked.bind(this))
		// html.on("click", "[data-apply-damage]", this.#applyDamage.bind(this));
		// html.on("click", "[data-apply-catharsis]", this.#applyCatharsis.bind(this));
		// html.on("click", "[data-apply-rest]", this.#applyRest.bind(this));
		html.on("click", "[data-evaluate-roll]", this.#evaluateRoll.bind(this));
		
		html.on('click', '[data-place-template]', this.#placeTemplate.bind(this));
	}

	/* -------------------------------------------- */
	/*  Actions                                     */
	/* -------------------------------------------- */

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

	
	
	async #evaluateRoll(event, target){
		event.preventDefault();
		event.stopPropagation();
		const index = target.dataset.roll;
		const critical = target.dataset.critical;
		const messageId = target.closest(".chat-message").dataset.messageId;
		const message = game.messages.get(messageId);
		const rolls = message.system.rolls;

		const content = document.createElement('div');
		const rollsDiv = document.createElement('div');
		content.innerHTML = message.content;
		let amplify = 0;
		console.error(rolls);
		let criticalHit = rolls.some( r => r.options?.critical );
		for (const [i, roll] of rolls.entries()) {
			const r = SkyfallRoll.fromData(roll);
			// const roll = message.system.rolls[index];
			r.index = i;
			if ( index == i ) {
				if ( r.options.type == 'damage' && critical ) {
					r.alter(2);
				}
				await r.evaluate();
				if ( r.options.type == 'attack' ) {
					const criticalTarget = roll.options.critical?.range ?? 20; 
					if ( r.dice[0].total >= criticalTarget ) {
						rolls[i].options.critical = true;
					}
					amplify = r.terms[0].total;
					for (const [ii, roll2] of rolls.entries()) {
						console.error( roll2 );
						roll2.terms = roll2.terms.filter( t => ((t.options.amplify ?? 0 ) <= amplify) );
						// roll2.formula = roll2.resetFormula();
					}
				}
			}
			r.template = await r.render();
			const rdiv = document.createElement('div');
			rdiv.innerHTML = r.template;
			rollsDiv.append(rdiv);
			rolls[i] = r;
		}
		console.error(amplify);
		content.querySelectorAll('.modifications .hidden[data-amplify]').forEach( i => Number(i.dataset.amplify) <= amplify ? i.classList.remove('hidden') : null);
		content.querySelector('.rolls').innerHTML = rollsDiv.innerHTML;

		message.update({
			"content": content.innerHTML,
			"system.rolls": message.system.rolls,
			"rolls": rolls.filter( i => i._evaluated),
		});

		return;
		const button = event.currentTarget;
		const chatCardId = button.closest(".chat-message").dataset.messageId;
		// const message = game.messages.get(chatCardId);
		const rollTitle = button.closest(".roll-entry").dataset.rollTitle;
		const rollIndex = message.system.rolls.findIndex( r => r.options.flavor == rollTitle );
		
		await message.#evaluateRolls(rollIndex, {
			skipConfig: event.shiftKey
		});
		if ( !foundry.utils.isEmpty(message.updateData) ) { 
			await message.update(message.updateData);
			message.updateData = null;
		}
	}
	
	async #evaluateRolls(index = null, options){
		const rollData = this.system.rolls[index];
		const roll = SkyfallRoll.fromData(rollData);
		roll.toMessage();
		return;
		await this.getDocuments();
		this.rollData = {};
		if ( this._actor ) {
			this.rollData = this._actor?.getRollData();
			if ( this._ability ) {
				this.rollData = foundry.utils.mergeObject(this.rollData, (this._ability?.getRollData() ?? {}));
			}
			if ( this._item ) { 
				this.rollData = foundry.utils.mergeObject(this.rollData, (this._item?.getRollData() ?? {}));
				// rollData.weapon = rollData.item.weapon ?? null;
			}
		}
		let criticalHit = false;
		for (const [i, rollData] of Object.entries(this.system.rolls)) {
			if( index != null && index != i ) continue;
			const roll = await new RollConfig({
				type: rollData.options.type,
				ability: rollData.options.ability,
				bonus: rollData.options.bonus,
				formula: rollData.options.formula,
				protection: rollData.options.protection,
				damageType: rollData.options.damageType,
				rollIndex: i,
				message: this.id,
				rollData: this.rollData,
				createMessage: false,
				skipConfig: options.skipConfig ?? false,
			}).render( !options.skipConfig );
		}
	}

	async #applyCatharsis(event, target) {
		event.preventDefault();
		event.stopPropagation();
		return;
	}
	
	
	#applyDamage(event) {
		event.preventDefault();
		event.stopPropagation();
		const button = event.currentTarget;
		button.event = event.type; //Pass the trigger mouse click event
		const modifier = Number(button.dataset.applyDamage);
		const damage = button.closest('.roll-entry').querySelector('.dice-total').innerText;

		const chatCardId = button.closest(".chat-message").dataset.messageId;
		const message = game.messages.get(chatCardId);
		const rollTitle = button.closest(".roll-entry").dataset.rollTitle;
		const rollIndex = button.closest(".roll-entry").dataset.rollIndex;
		const roll =  message.rolls[rollIndex];
		//.find( r => r.options.title == rollTitle && r.options.types.includes('damage') );
		
		for (const token of canvas.tokens.controlled) {
			token.actor.applyDamage( roll , modifier, true );
		}
	}
	
	/**
	* Retrieve AbilityTemplate data and Draw on Canvas
	* @param {Event} event   The originating click event
	* @private
	*/
	async #placeTemplate(event, taget) {
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
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritdoc */
	prepareBaseData() {
		super.prepareBaseData();
		console.log('prepareData');
		if ( this.type == 'usage' && this.system.actorId ) {
			// this.system.actor = fromUuidSync(this.system.actorId);
		}
	}

	/* -------------------------------------------- */
	/*  System Methods                              */
	/* -------------------------------------------- */
	
	_getButtons(){
		const buttons = [];
		if( game.user == this.author.id ) return buttons;
		buttons.push(
			{action: 'configure', label: "SKYFALL2.Configure"},
		);
		if ( this.system.item.type !== 'guild-ability' ) {
			buttons.push(
				{action: 'consumeResources', label: "SKYFALL2.Consume"},
			);
		}
		return buttons;
	}

	
	actorPortrait(){
		const token = fromUuidSync(`Scene.${this.speaker.scene}.Token.${this.speaker.token}`)?.img;
		const actor = fromUuidSync(`Actor.${this.speaker.actor}`)?.img;
		const owner = fromUuidSync(`${this.system.actorId}`)?.img;
		const portrait = owner ?? actor ?? token ?? 'icons/svg/mystery-man.svg';
		console.log('actorPortrait', portrait);
		this.updateSource({'system.portrait': portrait});
	}

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	async _preCreate(data, options, user) {
		return await super._preCreate(data, options, user);
	}
	
	/** @inheritDoc */
	_onCreate(data, options, userId) {
		return super._onCreate(data, options, userId);
	}

	/** @inheritDoc */
	async _preUpdate(changed, options, user) {
		return await super._preUpdate(changed, options, user);
	}
	
	/** @inheritDoc */
	_onUpdate(changed, options, userId) {
		return super._onUpdate(changed, options, userId);
	}

}