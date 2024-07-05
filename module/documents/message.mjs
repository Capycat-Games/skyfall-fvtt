import RollConfig from "../apps/roll-config.mjs";
import D20Roll from "../dice/d20-roll.mjs";
import SkyfallRoll from "../dice/skyfall-roll.mjs";

export default class SkyfallMessage extends ChatMessage {

	actor;
	ability;
	item;
	updateData;
	

	/* -------------------------------------------- */
	/*  Usage Workflows                             */
	/* -------------------------------------------- */
	
	/* Set a reference to the Actor and items being used */
	async #updateUsagePrepareData(){
		console.warn("updateUsagePrepareData",this.system.modifications);
		await this.getDocuments();
		this.#applyItemToAbility();
		this.#prepareModifications();
		this.#applyModifications();
		this.#prepareRolls();
		this.#prepareAreaTemplate();
		this.#prepareEffects();
		await this.#prepareUsageHTML();
		console.warn("updateData",this.updateData);
		// return this.updateData;
	}
	
	async updateUsagePrepareData() {
		this.#applyItemToAbility();
		this.#prepareModifications();
		this.#applyModifications();
		this.#prepareRolls();
		this.#prepareAreaTemplate();
		this.#prepareEffects();
		await this.#prepareUsageHTML();
		
		return this.updateData;
	}

	async getDocuments(){
		if ( this.actor ) return;
		const {actorId, abilityId, itemId} = this.system;
		this.actor = await fromUuid(actorId);
		if ( !this.actor ) return ui.notifications.warn("Não é possível configurar esta mensagem, Actor não foi encontrado.");
		this.ability = this.actor.items.get(abilityId);
		this.item = this.actor.items.get(itemId);
	}
	
	/**
	 * Add specific modifiers that como from an item.
	 * Example. Melee Attack + Weapon:
	 * - Overwrite Ability range and damage for Weapon range and damage
	 */
	#applyItemToAbility(){
		const {actorId, abilityId, itemId} = this.system;
		const actor = this.actor; //game.actor.get(actorId);
		const ability = this.ability; //actor.items.find( i => i.id == abilityId);
		const item = this.item;
		this.system.item = ability.toObject();
		this.system.item.img = null;
		
		// Get a default active effect where ability changes are configured;
		const itemover = ability.effects.find( ef => ef.name == 'FromItem');
		if ( !item || !itemover  ) return;
		this.system.item.system.descriptors = ability.system.descriptors.concat( item.system.descriptors );
		this.system.item.img = item.img;

		const AFMODES = CONST.ACTIVE_EFFECT_MODES;
		for (const change of itemover.changes) {
			if (!foundry.utils.hasProperty( this.system.item, change.key )) continue;
			let value = RollSF.replaceFormulaData(change.value, item.getRollData() );
			
			if( change.mode == AFMODES.CUSTOM ){
			} else if( change.mode == AFMODES.MULTIPLY ){
			} else if( change.mode == AFMODES.ADD ){
			} else if( change.mode == AFMODES.DOWNGRADE ){
			} else if( change.mode == AFMODES.UPGRADE ){
			} else if( change.mode == AFMODES.OVERRIDE ){
				foundry.utils.setProperty(this.system.item, change.key, value);
			}
		}
		this.updateData ??= {};
		this.updateData.system ??= {};
		this.updateData.system.item = this.system.item;
		this.updateData.system.actorId = this.system.actorId;
		this.updateData.system.abilityId = this.system.abilityId;
		this.updateData.system.itemId = this.system.itemId;
		
		return;
		switch (item.type) {
			case 'weapon':
			case 'equipment':
				break;
			case 'other':
				break;
			default:
				break;
		}
	}

	#prepareModifications(){
		const item = this.system.item;
		if ( !foundry.utils.isEmpty(this.system.modifications) ) return;
		for (const mod of this.actor?.allModifications ) {
			const {itemName, itemType, descriptors} = mod.system.apply;
			// Ignore modifications if apply condition is not met;
			if ( itemName && !itemName.split(',').map(n=>n.trim()).includes(item.name) ) continue;
			if ( itemType.includes('self') && mod.parent.id != item._id ) continue;
			if ( !foundry.utils.isEmpty(itemType) && !itemType.includes('self') && !itemType.includes(item.type) ) continue;
			if ( !foundry.utils.isEmpty(descriptors) && !descriptors.every( d => item.system.descriptors.includes(d) ) ) continue;
			this.system.modifications[mod.id] = {
				id: mod.id,
				uuid: mod.uuid,
				name: mod.name,
				cost: mod.system.cost.value,
				resource: mod.system.cost.resource,
				apply: mod.system.apply.always ? 1 : 0,
			}
			console.warn(mod.system.cost);
			console.warn(mod.system.cost);
		}
		this.updateData ??= {};
		this.updateData.system ??= {};
		this.updateData.system.modifications = this.system.modifications;
	}

	#applyModifications(){
		console.groupCollapsed('applyModifications');
		const ability = this.system.item.system.activation;
		// if ( act.resource )
		this.system.costs['ep'] += ability.cost;
		console.log(ability.cost);
		for ( const mod of Object.values(this.system.modifications) ) {
			const effect = this.actor?.allModifications.find( ef => ef.id == mod.id);
			if ( !mod.apply || Number(mod.apply) < 1 ) continue;
			this.system.costs[mod.resource] += mod.cost;
			console.log(mod);
			continue;
			/**
			 * TODO APPLY SPECIAL CASES USAGE EFFECTS
			 * Ones that Change Roll
			 * Ones that Change Effect 
			 */
			for (const change of effect.changes) {
				effect.apply(this.ability, change);
			}
		}
		this.updateData ??= {};
		this.updateData.system ??= {};
		this.updateData.system.item = this.system.item;
		this.updateData.system.cost = this.system.costs;
		console.log(this.updateData);
		console.groupEnd();
	}

	#prepareRolls(){
		const item = this.system.item;
		const advantage = this.getFlag('skyfall', 'advantage');
		const disadvantage = this.getFlag('skyfall', 'disadvantage');

		this.system.rolls = [];
		let damageType = item.system.descriptors.find( d => SYSTEM.DESCRIPTOR.DAMAGE[d] );
		const rollData = foundry.utils.mergeObject(this.actor.getRollData(), this.ability.getRollData());
		if ( this.item ) rollData.item = this.item.getRollData();
		if ( item.system.attack?.type ) {
			// TODO REWORK USING ROLLCONFIG APP
			rollData['prof'] = rollData.proficiency;
			const attack = item.system.attack;
			const terms = [ {term: '1d20', options: {flavor: '', name: 'd20', source: ''}}, ];
			
			terms.push( {term: `${attack.type}`, options: {flavor: '', name: 'ability', source: ''}} );
			terms.push( {term: `@prof`, options: {flavor: '', name: 'proficiency', source: ''}} );
			rollData['prof'] = rollData.proficiency;

			let rollConfig = {
				advantage: advantage ?? 0,
				disadvantage: disadvantage ?? 0,
				rollData: rollData,
				terms: terms,
			}
			const roll = D20Roll.fromConfig( rollConfig );
			roll.configureRoll();
			roll.options.flavor = "Ataque";
			roll.options.types = ["attack"];
			roll.options.type = "attack";
			roll.options.ability = (attack.type == "@magic" ? rollData.spellcasting : (attack.type.replace('@','') ?? 'str'));
			this.system.rolls.push( roll );
			// let roll = new D20Roll(`${d20} + @prof + ${item.system.attack.type}`, rollData, {types:['check','attack'], flavor:'Ataque', advantage:advantage, disadvantage:disadvantage });
			// this.system.rolls.push(roll);
			
		}

		if ( item.system.attack?.damage ) {
			rollData.weapon = rollData.item.weapon;
			let roll = new SkyfallRoll(`${item.system.attack.damage}`, rollData, {
				types:['damage'],
				flavor:'Dano Acerto',
				type: "damage",
				formula: item.system.attack.damage,
			});
			this.system.rolls.push(roll);
		}

		if ( item.system.effect?.damage ) {
			let roll = new SkyfallRoll(`${item.system.effect.damage}`, rollData, {types:['damage'], flavor:'Dano Efeito'});
			roll.terms.map( t => t.options.flavor = damageType );
			this.system.rolls.push(roll);
		}
		this.updateData ??= {};
		this.updateData.system ??= {};
		this.updateData.system.rolls = this.system.rolls;
	}

	async #evaluateRolls(index = null){
		await this.getDocuments();
		this.rollData = {};
		if ( this.actor ) {
			this.rollData = this.actor?.getRollData();
			if ( this.ability ) {
				this.rollData = foundry.utils.mergeObject(this.rollData, (this.ability?.getRollData() ?? {}));
			}
			if ( this.item ) { 
				this.rollData = foundry.utils.mergeObject(this.rollData, (this.item?.getRollData() ?? {}));
				// rollData.weapon = rollData.item.weapon ?? null;
			}
		}
		let criticalHit = false;
		for (const [i, rollData] of Object.entries(this.system.rolls)) {
			if( index != null && index != i ) continue;
			console.warn(rollData, this, this.rollData);
			const roll = await new RollConfig({
				type: rollData.options.type,
				ability: rollData.options.ability,
				formula: rollData.options.formula,
				protection: rollData.options.protection,
				rollIndex:i,
				message: this.id,
				rollData: this.rollData,
				createMessage:false
			}).render(true);
		}
	}

	async _updateRoll(roll, index){
		this.rolls[index] = roll;
		this.system.rolls[index].evaluated = true;
		this.system.rolls[index].template = await roll.render({flavor: roll.options.flavor});
		if ( roll.options.types?.includes('attack') && roll.dice[0].total == 20 ) {
			criticalHit = true;
		}
		this.updateData ??= {}
		this.updateData.system ??= {}
		this.updateData.rolls = this.rolls;
		this.updateData.system.rolls = this.system.rolls;
		await this.#prepareUsageHTML();
		if ( !foundry.utils.isEmpty(this.updateData) ) { 
			await this.update(this.updateData);
			this.updateData = null;
		}
	}
	
	#prepareAreaTemplate(){
		const item = this.system.item;
		if ( item.system.target.shape ) {
			this.system.measuredTemplate.push({t: item.system.target.shape});
		}
		this.updateData ??= {};
		this.updateData.system ??= {};
		this.updateData.system.measuredTemplate = this.system.templates;
	}

	#prepareEffects() {
		const item = this.system.item;
		this.system.effects = [];
		for (const ef of item.effects) {
			if ( ef.type == 'modification' && !ef.isTemporary ) continue;
			if ( ef.disabled ) continue;
			let statusEffect = CONFIG.statusEffects.find(e => e.name == ef.name);
			if( statusEffect ) statusEffect._id = statusEffect.id;
			this.system.effects.push( statusEffect ?? ef );
		}
		this.updateData ??= {};
		this.updateData.system ??= {};
		this.updateData.system.effects = this.system.effects;
	}

	async #prepareUsageHTML(){
		const templateData = {
			usage: this.system,
			SYSTEM: SYSTEM,
			modifications: this.system.modifications,
			effects: this.system.effects,
			rolls: this.system.rolls,
		}
		const tempItem = new Item(templateData.usage.item);
		// templateData.usage.item._labels = tempItem.system._labels;
		templateData.item = tempItem;
		const mods = {};
		Object.values(templateData.modifications).reduce((acc, mod) => {
			if ( Number(mod.apply) > 0 ) acc[mod.id] = mod;
			return acc;
		}, mods);
		templateData.modifications = mods;
		let template = `systems/${SYSTEM.id}/templates/chat/usage.hbs`;
		const content = await renderTemplate(template, templateData);
		this.updateData ??= {};
		this.updateData.content = content;
	}

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		const actor = fromUuidSync(data.system?.actorId);
		console.log(data, actor);
		if ( actor ) data.speaker = {actor: (actor.token.name ?? actor.name)};
		await super._preCreate(data, options, user);
		return;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _onCreate(data, options, user) {
		await super._onCreate(data, options, user);
		console.warn(this, data, options, user);
		if ( data.type == 'usage' && user == data.author ) {
			await this.#updateUsagePrepareData();
			if ( !foundry.utils.isEmpty(this.updateData) ) {
				// delete this.updateData._id;
				await this.update(this.updateData, {contentRendered:true})
				this.updateData = null;
			}

			if ( options.skipConfig ) {
				await this.#evaluateRolls();
				if ( !foundry.utils.isEmpty(this.updateData) ) { 
					await this.update(this.updateData, {contentRendered:true})
					this.updateData = null;
				}
			} else {
				this.sheet.render(true);
			}
		}
		return;
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _preUpdate(data, options, userId) {
		if ( this.type == 'usage' ){
			console.warn("_preUpdate",data);
			// delete data._id;

			// foundry.utils.mergeObject(this, data);
			// console.warn(options.contentRendered);
			// if( !options.contentRendered ) {
			// 	await this.#prepareUsageHTML();
			// }
			// if ( !foundry.utils.isEmpty(this.updateData) ) { 
			// 	// await this.update(this.updateData)
			// 	data = foundry.utils.mergeObject(data, this.updateData);
			// 	// this.updateData = null;
			// }
		}
		console.warn(data, this.updateData);
		return await super._preUpdate(data, options, userId);
		// Prevent Update of commited message;
		if ( data.type == 'usage' ) {
			const html = await this.usageRenderTemplate();
			data.content = html;
		}
		if ( data.type == 'usage' && this.system.status.phase == 4 && !game.user.isGM ) {
			return ui.notifications.warn('SKYFALL.CHATMESSAGE.USAGE.UPDATECOMMITED');
		}
		return await super._preUpdate(data, options, userId);
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	_onUpdate(data, options, userId) {
		super._onUpdate(data, options, userId);
		console.warn("_onUpdate",data);
		return;
	}

	/* -------------------------------------------- */
	/*  Event Handling                              */
	/* -------------------------------------------- */

	/**
	 * Render the HTML for the ChatMessage which should be added to the log
	 * @returns {Promise<jQuery>}
	 */
	async getHTML() {
		console.log("getHTML");
		const html = await super.getHTML();
		html[0].classList.add('skyfall');
		console.log('getHTML');
		if ( this.type == 'usage' ) {
			const bgOverlay = document.createElement("div");
			bgOverlay.classList.add("header-overlay");
			html.prepend( bgOverlay );
			if ( this.system.modifications ){
				let mods = Object.values(this.system.modifications);
				mods = mods.filter(m=> m.apply > 0 ).map(m => `<li>@Embed[${m.uuid}]</li>`).join('');
				let modslist = await TextEditor.enrichHTML(mods);
				$(html).find('ul.modifications').html(modslist);
				//mods = mods.map( ef => `@Embed[${ef.uuid}]` ).join(' ');
				//context.enriched.modifications = await TextEditor.enrichHTML(`<div>${mods}</div>`);
			}
		}

		// Context menu
		const metadata = $(html).find(".message-metadata");
		metadata.find(".message-delete")?.remove();
		const anchor = document.createElement("a");
		anchor.setAttribute("aria-label", game.i18n.localize("SKYFALL.MESSAGE.CONTROLS"));
		anchor.classList.add("chat-control");
		anchor.dataset.contextMenu = "";
		anchor.innerHTML = '<i class="fas fa-ellipsis-vertical fa-fw"></i>';
		metadata.append(anchor);

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
			b.title = title;
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
				title: "SKYFALL.MESSAGE.APPLYDAMAGE",
				dataset: [['applyDamage',1]]
			},
			double: {
				text: '2x',
				title: "SKYFALL.MESSAGE.APPLYDOUBLEDAMAGE",
				dataset: [['applyDamage',2]]
			},
			half: {
				text: '½',
				title: "SKYFALL.MESSAGE.APPLYHALFDAMAGE",
				dataset: [['applyDamage',0.5]]
			},
			heal: {
				text: '<i class="fa-solid fa-plus"></i>',
				title: "SKYFALL.MESSAGE.APPLYHEAL",
				dataset: [['applyDamage',-1]]
			},
			catharsis: {
				text: '<i class="fa-solid fa-bahai"></i>',
				title: "SKYFALL.MESSAGE.CATHARSIS",
				dataset: [['applyCatharsis','+']]
			},
			catharsisminus: {
				text: '<i class="fa-solid fa-bahai"></i>',
				title: "SKYFALL.MESSAGE.CATHARSIS",
				dataset: [['applyCatharsis','-']]
			},
			evaluate: {
				text: '<i class="fa-solid fa-dice"></i>',
				title: "SKYFALL.MESSAGE.ROLL",
				dataset: [['evaluateRoll','1']]
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
			// Button Apply Damage Double
			button = btnCreate( buttons.double );
			btncontainer.append(button);
			// Append to Roll Template
			damageRoll.append(btncontainer);
			
			// Right Buttons
			btncontainer = document.createElement("span");
			btncontainer.classList.add('roll-btns', 'right', 'bottom');
			// Button Apply Damage Half
			button = btnCreate( buttons.half );
			btncontainer.append(button);
			// Button Apply Damage as Heal
			button = btnCreate( buttons.heal );
			btncontainer.append(button);
			// Append to Roll Template
			damageRoll.append(btncontainer);
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
			// Append to Roll Template
			diceRoll.append(btncontainer);
			// Left Buttons
			btncontainer = document.createElement("span");
			btncontainer.classList.add('roll-btns', 'right', 'top');
			// Button Apply Damage Double
			button = btnCreate( buttons.catharsis );
			btncontainer.append(button);
			// Append to Roll Template
			diceRoll.append(btncontainer);
		}

		diceRolls = chatHTML.querySelectorAll('.roll-entry:not(.evaluated)');
		for (const diceRoll of diceRolls) {
			if( !diceRoll ) continue;
			btncontainer = document.createElement("span");
			btncontainer.classList.add('roll-btns', 'right', 'top');
			// Button Apply Damage
			button = btnCreate( buttons.evaluate );
			btncontainer.append(button);
			diceRoll.append(btncontainer);
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
		html.on("click", "[data-apply-damage]", this.#applyDamage.bind(this));
		html.on("click", "[data-apply-catharsis]", this.#applyCatharsis.bind(this));
		html.on("click", "[data-apply-rest]", this.#applyRest.bind(this));
		html.on("click", "[data-evaluate-roll]", this.#evaluateRoll.bind(this));
		
		html.on('click', '[data-place-template]', this.#placeTemplate.bind(this));
	}

	/* -------------------------------------------- */

	/**
	 * Handle clicks on action button elements.
	 * @param {PointerEvent} event        The initiating click event
	 * @returns {Promise<void>}
	 */
	async #onClickControl(event) {
		event.preventDefault();
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
		}
	}

	/* -------------------------------------------- */
	async #evaluateRoll(event){
		event.preventDefault();
		const button = event.currentTarget;
		const chatCardId = button.closest(".chat-message").dataset.messageId;
		const message = game.messages.get(chatCardId);
		const rollTitle = button.closest(".roll-entry").dataset.rollTitle;
		const rollIndex = message.system.rolls.findIndex( r => r.options.flavor == rollTitle );
		await message.#evaluateRolls(rollIndex);
		if ( !foundry.utils.isEmpty(message.updateData) ) { 
			await message.update(message.updateData);
			message.updateData = null;
		}
	}

	#applyDamage(event) {
		event.preventDefault();
		const button = event.currentTarget;
		button.event = event.type; //Pass the trigger mouse click event
		const modifier = Number(button.dataset.applyDamage);
		const damage = button.closest('.roll-entry').querySelector('.dice-total').innerText;

		const chatCardId = button.closest(".chat-message").dataset.messageId;
		const message = game.messages.get(chatCardId);
		const rollTitle = button.closest(".roll-entry").dataset.rollTitle;
		const roll =  message.rolls.find( r => r.options.flavor == rollTitle && r.options.types.includes('damage') );
		
		for (const token of canvas.tokens.controlled) {
			token.actor.applyDamage( roll , modifier, true );
		}
	}

	async #applyCatharsis(event) {
		event.preventDefault();
		if ( !game.user.isGM && canvas.tokens.controlled) {
			const actor = canvas.tokens.controlled[0]?.actor;
			const current = actor.system.resources.catharsis.value;
			if ( current == 0 ) return ui.notifications.info("Catarse Insuficiente");
		}
		const rollTerms = foundry.dice.terms;
		const button = event.currentTarget;
		const chatCardId = button.closest(".chat-message").dataset.messageId;
		const operator = button.dataset.applyCatharsis;
		const message = game.messages.get(chatCardId);
		const rollTitle = button.closest(".roll-entry").dataset.rollTitle;
		const rollIndex = button.closest(".roll-entry").dataset.rollIndex;
		// const rollIndex = message.rolls.findIndex( r => r.options.flavor == rollTitle );
		const roll = message.rolls.find( r => r.options.rollIndex == rollIndex );
		await roll.applyCatharsis({operator});
		message.system.rolls[rollIndex].template = await roll.render({flavor: roll.options.flavor});
		
		message.updateData = {};
		message.updateData.system = {};
		message.updateData.rolls = message.rolls;
		message.updateData.system.rolls = message.system.rolls;

		await message.#prepareUsageHTML();
		if ( !foundry.utils.isEmpty(message.updateData) ) {
			await message.update(message.updateData);
			message.updateData = null;
		}
		if ( !game.user.isGM && canvas.tokens.controlled) {
			const actor = canvas.tokens.controlled[0]?.actor;
			const current = actor.system.resources.catharsis.value;
			actor.update({"system.resources.catharsis.value": current - 1});
		}
	}

	async #applyRest(event){
		event.preventDefault();
		const button = event.currentTarget;
		const actorId = button.closest('.rest-card').dataset.actorId;
		const actor = game.actors.get(actorId);
		const messageId = button.closest('.chat-message').dataset.messageId;
		const message = game.messages.get(messageId);
		if ( !actor || actor.isOwnser ) return;
		actor.shortRest(message);
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
		const item = message.system.item;
		if( !item ) return;
		const template = game.skyfall.canvas.AbilityTemplate.fromItem(item);
		
		if ( template ) {
			template.drawPreview();
		}
	}
}