import D20Roll from "../dice/d20-roll.mjs";
import SkyfallRoll from "../dice/skyfall-roll.mjs";

export default class SkyfallMessage extends ChatMessage {
	actor;
	item;
	weapon;
	updateData = {};
	
	get usage() {
		return this.system.something;
	}
	
	async getHTML() {
		let html = await super.getHTML();
		
		if ( this.system.portrait ) {
			let image = document.createElement('img');
			image.src = this.system.portrait;
			image.classList.add('actor-portrait');

			$(html).find('.message-header').prepend( `<img src="${this.system.portrait}" width=28 heigth=28>` );
		}
		if( this.type == 'usage' ) {
			$(html)[0].classList.add('skyfall', 'usage', (this.system.actor?.type ?? null));
		}
		// Add Damage Apply Buttons
		this._rollButtons(html);

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

	/**
	 * Render Action Buttons Over roll-template
	 */
	_rollButtons(html){
		let chatHTML = html.find(".message-content");
		let noButtons = chatHTML.find(".rest-card");
		if ( noButtons[0] ) return;
		if ( !chatHTML[0] ) return;
		chatHTML = chatHTML[0];
		
		let button, btncontainer;
		// Create Button Element;
		let btnCreate = function({ text = '', title = '', dataset = [] }){
			let b = document.createElement("button");
			b.innerHTML = text;
			b.classList.add('roll-button');
			for (const d of dataset) {
				if ( Array.isArray(d) && d[0] && d[1] ){
					b.dataset[d[0]] = d[1];
				}
			}
			return b;
		}

		const buttons = {
			damage: {
				text: '<i class="fa-solid fa-minus"></i>',
				dataset: [['applyDamage',1], ['tooltip', "SKYFALL2.MESSAGE.ApplyDamage"]]
			},
			double: {
				text: '2x',
				dataset: [['applyDamage',2], ['tooltip', "SKYFALL2.MESSAGE.ApplyDoubleDamage"]]
			},
			half: {
				text: '½',
				dataset: [['applyDamage',0.5], ['tooltip', "SKYFALL2.MESSAGE.ApplyHalfDamage"]]
			},
			heal: {
				text: '<i class="fa-solid fa-plus"></i>',
				dataset: [['applyDamage',-1], ['tooltip', "SKYFALL2.MESSAGE.ApplyHeal"]]
			},
			catharsis: {
				text: SYSTEM.icons.sfcatharsis,
				dataset: [['applyCatharsis','+'], ['tooltip', "SKYFALL2.MESSAGE.AddCatharsis"]]
			},
			catharsisminus: {
				text: SYSTEM.icons.sfcatharsis,
				dataset: [['applyCatharsis','-'], ['tooltip', "SKYFALL2.MESSAGE.SubtractCatharsis"]]
			},
			evaluate: {
				text: '<i class="fa-solid fa-dice"></i>',
				dataset: [['evaluateRoll','1'], ['tooltip', "SKYFALL2.MESSAGE.Roll"]]
			}
		}

		// Get Element To Append to;
		let damageRolls = chatHTML.querySelectorAll('.roll-entry.evaluated:not(.D20Roll)');
		for (const damageRoll of damageRolls) {
			if( !damageRoll ) continue;
			// Left Buttons
			btncontainer = document.createElement("span");
			btncontainer.classList.add('roll-btns', 'left', 'bottom');
			// Button Apply Damage
			button = btnCreate( buttons.damage );
			btncontainer.append(button);
			damageRoll.querySelector('.dice-result .dice-total').append(button);
			// Button Apply Damage Double
			button = btnCreate( buttons.double );
			btncontainer.append(button);
			damageRoll.querySelector('.dice-result .dice-total').append(button);
			// Append to Roll Template
			// damageRoll.append(btncontainer);
			
			// Right Buttons
			btncontainer = document.createElement("span");
			btncontainer.classList.add('roll-btns', 'right', 'bottom');
			// Button Apply Damage Half
			button = btnCreate( buttons.half );
			btncontainer.append(button);
			damageRoll.querySelector('.dice-result .dice-total').append(button);
			// Button Apply Damage as Heal
			button = btnCreate( buttons.heal );
			btncontainer.append(button);
			damageRoll.querySelector('.dice-result .dice-total').append(button);
			// Append to Roll Template
			// damageRoll.append(btncontainer);
		}

		// Get Element To Append Catharsis to;
		let diceRolls = chatHTML.querySelectorAll('.roll-entry.evaluated');
		for (const diceRoll of diceRolls) {
			if( !diceRoll ) continue;
			// Left Buttons
			btncontainer = document.createElement("span");
			btncontainer.classList.add('roll-btns', 'left', 'top');
			// Button Apply Damage
			button = btnCreate( buttons.catharsisminus );
			btncontainer.append(button);
			diceRoll.querySelector('.dice-result .dice-formula').append(button);
			// Append to Roll Template
			// diceRoll.append(btncontainer);
			// Left Buttons
			btncontainer = document.createElement("span");
			btncontainer.classList.add('roll-btns', 'right', 'top');
			// Button Apply Damage Double
			button = btnCreate( buttons.catharsis );
			btncontainer.append(button);
			diceRoll.querySelector('.dice-result .dice-formula').append(button);
			// Append to Roll Template
			// diceRoll.append(btncontainer);
		}

		diceRolls = chatHTML.querySelectorAll('.roll-entry:not(.evaluated)');
		for (const diceRoll of diceRolls) {
			if( !diceRoll ) continue;
			btncontainer = document.createElement("span");
			btncontainer.classList.add('roll-btns', 'right', 'top');
			// Button Apply Damage
			button = btnCreate( buttons.evaluate );
			btncontainer.append(button);
			diceRoll.querySelector('.dice-result .dice-formula').append(button);
			// diceRoll.append(btncontainer);
		}
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

	/**
	 * Handle clicks on action button elements.
	 * @param {PointerEvent} event        The initiating click event
	 * @returns {Promise<void>}
	 */
	async #onClickControl(event) {
		event.preventDefault();
		// await this.getDocuments();
		const button = event.currentTarget;
		button.event = event; //Pass the trigger mouse click event
		switch ( button.dataset.action ) {
			case "configure":
				this.sheet.render(true);
				break;
			case "aid":

				break;
			case "catharsis":

				break;
			case "placeTemplate":

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

	

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritdoc */
	prepareData() {
		super.prepareData();
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


	async prepareContentData2(){
		const advantage = this.getFlag('skyfall', 'advantage');
		const disadvantage = this.getFlag('skyfall', 'disadvantage');
		const weapon = this.weapon;
		const context = {};
		context.SYSTEM = SYSTEM;
		context.buttons = this._getButtons();
		context.actor = this.actor;
		context.item = this.item;
		context.rolls = {
			listed: [],
			evaluated: [],
		}
		const RollData = foundry.utils.mergeObject(
			this.actor.getRollData(), this.item.getRollData()
		);
		if ( weapon ) {
			RollData['item'] = weapon.getRollData();
			context.item.img = weapon.img;
			context.item.weapon = weapon.name;
			// MERGE DESCRIPTORS
			context.item.system.descriptors = [
				...context.item.system.descriptors,
				...weapon.system.descriptors,
			];
		}
		let damageType = context.item.system.descriptors.find( d => SYSTEM.DESCRIPTOR.DAMAGE[d] );
		const AbilityAttack = context.item.system.attack;
		// Attack Roll
		if ( AbilityAttack.ability ) {
			const attack = this.item.system.getAttack({
				RollData: RollData,
				weapon: this.weapon,
				advantage: advantage ?? 0,
				disadvantage: disadvantage ?? 0,
			});
			const roll = D20Roll.fromSkyfallTerms(attack.terms, RollData, attack.options);
			context.rolls.listed.push( roll );
		}
		// Damage Roll
		if ( AbilityAttack.damage ) {
			const damage = this.item.system.getDamage({
				RollData: RollData,
				weapon: this.weapon,
				damageType: damageType,
				versatile: false,
			});
			const roll = SkyfallRoll.fromSkyfallTerms(damage.terms, RollData, damage.options);
			context.rolls.listed.push( roll );
		}

		// Versatile Damage Roll
		if ( context.item.system.descriptors.includes('versatile') ) {
			const damage = this.item.system.getDamage({
				RollData: RollData,
				weapon: this.weapon,
				damageType: damageType,
				versatile: true,
			});
			const roll = SkyfallRoll.fromSkyfallTerms(damage.terms, RollData, damage.options);
			context.rolls.listed.push( roll );
		}
		// OLD ATTACK/DAMAGE
		context.modifications = this.system.modifications;
		const mods = {};
		Object.values(context.modifications).reduce((acc, mod) => {
			if ( Number(mod.apply) > 0 ) acc[mod.id] = mod;
			return acc;
		}, mods);
		context.modifications = mods;
		context.measuredTemplate = this.system.measuredTemplate;
		// context.buttons = this.system.buttons;
		context.effects = this.system.effects;
		
		this.updateData['system.rolls'] = context.rolls.listed;
		return context;
	}

	async updateContent() {
		this.updateData = {};
		const template = "systems/skyfall/templates/v2/chat/usage.hbs";
		// const messageData = await this.system.prepareContentData();
		await this.system.getDocuments();
		if ( !this.system.item ) return ui.notifications.error('ITEM NOT FOUND', {localize:true});
		const messageData = {};
		messageData.item = this.system.something.item;
		messageData.rolls = this.system.something.getAbilityRolls({
			advantage: this.getFlag('skyfall', 'advantage'),
			disadvantage: this.getFlag('skyfall', 'disadvantage'),
		});
		messageData.buttons = this._getButtons();
		this.updateData['system.rolls'] = messageData.rolls.listed;
		this.updateData['content'] = await renderTemplate(template, messageData);
		await this.update(this.updateData, {skipContent: true});
		this.updateData = {};
	}

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	/** @inheritDoc */
	_onCreate2(data, options, userId) {
		super._onCreate(data, options, userId);
		if ( this.type == 'usage' && !options.skipContent ) {
			this.updateContent();
		}
	}
	
	/** @inheritDoc */
	_onUpdate2(changed, options, userId) {
		super._onUpdate(changed, options, userId);
		if ( this.type == 'usage' && !options.skipContent ) {
			this.updateContent();
		}
	}

	async _preCreate(data, options, user) {
		let allowed = await super._preCreate(data, options, user);
		this.actorPortrait();
		console.groupCollapsed("MESSAGE _preCreate");
		console.groupEnd();
		if ( allowed && !data.content && !options.skipContent ) {
			await this.updateContent();
		}
		return allowed;
	}

	/** @inheritDoc */
	async _preUpdate(changed, options, user) {
		let allowed = await super._preUpdate(changed, options, user);
		if ( !('content' in changed) ) {
			await this.updateContent();
		}
		return allowed;
	}

	actorPortrait(){
		const token = fromUuidSync(`Scene.${this.speaker.scene}.Token.${this.speaker.token}`)?.img;
		const actor = fromUuidSync(`Actor.${this.speaker.actor}`)?.img;
		const owner = fromUuidSync(`${this.system.actorId}`)?.img;
		const portrait = owner ?? actor ?? token ?? 'icons/svg/mystery-man.svg';
		this.updateSource({'system.portrait': portrait});
	}

	
	async #evaluateRoll(event){
		event.preventDefault();
		event.stopPropagation();
		const button = event.currentTarget;
		const chatCardId = button.closest(".chat-message").dataset.messageId;
		const message = game.messages.get(chatCardId);
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

	
	/**
	* Retrieve AbilityTemplate data and Draw on Canvas
	* @param {Event} event   The originating click event
	* @private
	*/
	async #placeTemplate(event) {
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
}