const {renderTemplate} = foundry.applications.handlebars;

import RollConfig from "../apps/roll-config.mjs";
import D20Roll from "../dice/d20-roll.mjs";
import SkyfallRoll from "../dice/skyfall-roll.mjs";

export default class SkyfallMessage extends ChatMessage {

	// INITIAL DOCUMENTS
	_actor;
	_ability;
	_item;
	updateData;
	
	// FINAL DOCUMENT
	get item(){
		return this.system.item;
	}

	/* -------------------------------------------- */
	/*  Usage Workflows                             */
	/* -------------------------------------------- */
	
	/* Set a reference to the Actor and items being used */
	async #updateUsagePrepareData(){
		await this.getDocuments();
		this.#applyItemToAbility();
		this.#prepareModifications();
		this.#applyModifications();
		this.#prepareRolls();
		this.#prepareAreaTemplate();
		this.#prepareEffects();
		await this.#prepareUsageHTML();
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
		if ( this._actor ) return;
		const {actorId, abilityId, itemId} = this.system;
		this._actor = await fromUuid(actorId);
		if ( !this._actor ) return ui.notifications.warn("Não é possível configurar esta mensagem, Actor não foi encontrado.");
		this._ability = this._actor.items.get(abilityId);
		this._item = this._actor.items.get(itemId);
	}
	
	/**
	 * Add specific modifiers that como from an item.
	 * Example. Melee Attack + Weapon:
	 * - Overwrite Ability range and damage for Weapon range and damage
	 */
	#applyItemToAbility(){
		const actor = this._actor;
		const ability = this._ability;
		const item = this._item;
		this.system.item = ability.toObject();
		this.system.item.img = item?.img ?? ability.img;
		
		// Get a default active effect where ability changes are configured;
		const itemover = ability.effects.find( ef => ef.name == 'FromItem');
		if ( !item ) return;
		this.system.item.system.descriptors = ability.system.descriptors.concat( item.system.descriptors );
		this.system.item.img = item.img;
		/* ITEM CHANGES */
		if ( false ) {
			const _attack = item.system.attack;
			const _damage = item.system.damage;
			let attack = [`@${_attack.ability}`, _attack.bonus];
			let attackBonus = _attack.bonus.replace('-','+-').split('+');
			attackBonus = attackBonus.map(bonus => {
				return {
					term: bonus.trim(),
					options: {flavor: '', name: 'bonus', source: 'weapon'}
				};
			})
			this.system.item.system.attack._formula = [
				{
					term: '1d20',
					options: {flavor: '', name: 'd20', source: ''}
				},
				{
					term: `@${_attack.ability}`,
					options: {flavor: '', name: 'ability', source: 'weapon'}
				},
				...attackBonus,
			];
			let damage = [_damage.die, `@${_damage.ability}`, _damage.bonus];
			let damageBonus = _damage.bonus.replace('-','+-').split('+');
			damageBonus = damageBonus.map(bonus => {
				return {
					term: bonus.trim(),
					options: {flavor: '', name: 'bonus', source: 'weapon'}
				};
			})
			this.system.item.system.attack._damage = [
				{
					term: _damage.die,
					options: {flavor: '', name: 'weapon', source: 'weapon'}
				},
				{
					term: `@${_damage.ability}`,
					options: {flavor: '', name: 'ability', source: 'weapon'}
				},
				...damageBonus,
			];
		}
		// item.system.
		/* ITEM CHANGES */

		const AFMODES = CONST.ACTIVE_EFFECT_MODES;
		if ( itemover ) {
			for (const change of itemover?.changes) {
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
		}
		/* DESCRIPTOR CHANGES */
		
		/* /DESCRIPTOR CHANGES */
		
		/* CONSUME */
		if ( item.system.consume.target ) {
			const consumedItem = actor.items.find(i => i.id == item.system.consume.target);
			if ( consumedItem && item.system.reload ) {
				this.system.costs.quantity.push({
					id: item.id,
					path: 'system.reload.value',
					value: item.system.reload.value - 1
				});
			}
			if ( consumedItem ) {
				this.system.costs.quantity.push({
					id: consumedItem.id,
					path: 'system.quantity',
					value: consumedItem.system.quantity - 1
				});
			}
		}
		/* /CONSUME */

		this.updateData ??= {};
		this.updateData.system ??= {};
		this.updateData.system.item = this.system.item;
		this.updateData.system.actorId = this.system.actorId;
		this.updateData.system.abilityId = this.system.abilityId;
		this.updateData.system.itemId = this.system.itemId;
		
		return;
	}

	#prepareModifications(){
		const item = this.system.item;
		if ( !foundry.utils.isEmpty(this.system.modifications) ) return;
		for (const mod of this._actor?.allModifications ) {
			const {itemName, itemType, descriptors} = mod.system.apply;
			// Ignore modifications if apply condition is not met;
			if ( itemName && !itemName.split(',').map(n=>n.trim()).includes(item.name) ) continue;
			if ( itemType.includes('self') && mod.parent.id != item._id ) continue;
			if ( !foundry.utils.isEmpty(itemType) && !itemType.includes('self') && !itemType.includes(item.type) ) continue;
			if ( !foundry.utils.isEmpty(descriptors) && !descriptors.every( d => item.system.descriptors.includes(d) ) ) continue;
			
			this.system.modifications[mod.id] = {
				id: mod.id,
				uuid: mod.uuid,
				name: `${mod.parent.name}<br>[${mod.name}]`,
				description: mod.description,
				cost: mod.system.cost.value,
				resource: mod.system.cost.resource,
				apply: mod.system.apply.always ? 1 : 0,
			}
		}
		this.updateData ??= {};
		this.updateData.system ??= {};
		this.updateData.system.modifications = this.system.modifications;
	}

	#applyModifications(){
		console.groupCollapsed('applyModifications');
		const ability = this.system.item.system.activation;
		// if ( act.resource )
		if ( ability.cost ) this.system.costs['ep'] = ability.cost;
		
		for ( const mod of Object.values(this.system.modifications) ) {
			const effect = this._actor?.allModifications.find( ef => ef.id == mod.id);
			if ( !mod.apply || Number(mod.apply) < 1 ) continue;
			this.system.costs[mod.resource] += mod.cost;
			continue;
			/**
			 * TODO APPLY SPECIAL CASES USAGE EFFECTS
			 * Ones that Change Roll
			 * Ones that Change Effect 
			 */
			for (const change of effect.changes) {
				effect.apply(this._ability, change);
			}
		}
		this.updateData ??= {};
		this.updateData.system ??= {};
		this.updateData.system.item = this.system.item;
		this.updateData.system.costs = this.system.costs;
		console.groupEnd();
	}

	#prepareRolls(){
		const item = this.system.item;
		const advantage = this.getFlag('skyfall', 'advantage');
		const disadvantage = this.getFlag('skyfall', 'disadvantage');
		const weapon = this._item;
		const descriptors = item.system.descriptors;

		this.system.rolls = [];
		let damageType = descriptors.find( d => SYSTEM.DESCRIPTOR.DAMAGE[d] );
		const rollData = foundry.utils.mergeObject(this._actor.getRollData(), this._ability.getRollData());
		if ( this._item ) rollData.item = this._item.getRollData();
		if ( item.system.attack?.ability ) {
			rollData['prof'] = rollData.proficiency;
			const attack = item.system.attack;
			const wAttack = weapon?.system?.attack ?? {};
			const terms = [];
			terms.push({
				term: '1d20',
				options: {flavor: '', name: 'd20', source: ''}
			},{
				term: `@${wAttack.ability || attack.ability}`,
				options: {flavor: '', name: 'ability', source: 'weapon'}
			},{
				term: `@prof`,
				options: {flavor: '', name: 'proficiency', source: 'weapon'}
			},);
			if ( wAttack.bonus ) {
				terms.push({
					term: wAttack.bonus,
					options: {flavor: '', name: 'bonus', source: 'weapon'}
				});
			}
			if ( attack.bonus ) {
				terms.push({
					term: attack.bonus,
					options: {flavor: '', name: 'bonus', source: 'ability'}
				});
			}

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
			roll.options.ability = (attack.ability == "magic" ? rollData.spellcasting : (wAttack.ability || attack.ability || 'str'));
			roll.options.bonus = [wAttack.bonus, attack.bonus].filter(Boolean).join('+');
			this.system.rolls.push( roll );
		}
		
		if ( item.system.attack?.damage ) {
			if ( this._item ) rollData.weapon = rollData.item.weapon;
			const wDamage = weapon?.system?.damage ?? {};
			const formula = !weapon ? item.system.attack.damage : [
				(wDamage.die ? `${wDamage.die}`: '' ),
				(wDamage.ability ? `@${wDamage.ability}`: '' ),
				(wDamage.bonus ? `${wDamage.bonus}`: '' ),
			].filter(Boolean).join(' + ');
			let roll = new SkyfallRoll(`${formula}`,
				rollData, {
				types:['damage'],
				flavor:'Dano Acerto',
				title:'Dano Acerto',
				type: "damage",
				damageType: damageType,
				formula: formula,
			});
			this.system.rolls.push(roll);
			if ( descriptors.includes('versatile') ) {
				const formulaV = !weapon ? item.system.attack.damage : [
					(wDamage.versatile ? `${wDamage.versatile}`: '' ),
					(wDamage.ability ? `@${wDamage.ability}`: '' ),
					(wDamage.bonus ? `${wDamage.bonus}`: '' ),
				].filter(Boolean).join('+');
				let rollV = new SkyfallRoll(`${formulaV}`,
					rollData, {
					types:['damage'],
					flavor:'Dano Acerto (Versátil)',
					title:'Dano Acerto (Versátil)',
					type: "damage",
					damageType: damageType,
					formula: formulaV,
				});
				this.system.rolls.push(rollV);
			}
		}

		if ( item.system.effect?.damage ) {
			if ( this._item ) rollData.weapon = rollData.item.weapon;
			let roll = new SkyfallRoll(`${item.system.effect.damage}`,
				rollData, {
				types:['damage'],
				flavor:'Dano Efeito',
				title:'Dano Efeito',
				type: "damage",
				damageType: damageType,
				formula: item.system.effect.damage,
			});
			this.system.rolls.push(roll);
		}
		this.updateData ??= {};
		this.updateData.system ??= {};
		this.updateData.system.rolls = this.system.rolls;
	}

	async #evaluateRolls(index = null, options){
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

	async _updateRoll(roll, index){
		if ( this.rolling && this.rolls.length < (this.system.rolls.length - 1 ) ) {
			this.rolls[index] = roll;
			this.system.rolls[index].evaluated = true;
			this.system.rolls[index].template = await roll.render({flavor: roll.options.flavor});
			return;
		} else this.rolling = false;
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
		if ( item.system.target?.shape ) {
			this.system.measuredTemplate.push({t: item.system.target.shape});
			this.updateData ??= {};
			this.updateData.system ??= {};
			this.updateData.system.measuredTemplate = this.system.templates;
		}
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
			buttons: this._getButtons(),
		}
		const tempItem = new Item(this.item);
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
		if ( actor ) data.speaker = {actor: (actor.token?.name ?? actor.name)};
		await super._preCreate(data, options, user);
		return;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _onCreate(data, options, user) {
		await super._onCreate(data, options, user);
		if ( data.type == 'usage' && user == game.userId ) {
			await this.#updateUsagePrepareData();
			if ( !foundry.utils.isEmpty(this.updateData) ) {
				// delete this.updateData._id;
				await this.update(this.updateData, {contentRendered:true})
				this.updateData = null;
			}
			if ( options.skipConfig ) {
				this.rolling = true;
				await this.#evaluateRolls(null, {
					skipConfig: options.skipConfig
				});
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
	// async _preUpdate(changed, options, user) {
	// 	return await super._preUpdate(changed, options, user);
	// }

	/* -------------------------------------------- */

	// /** @inheritdoc */
	// _onUpdate(data, options, userId) {
	// 	super._onUpdate(data, options, userId);
	// 	return;
	// }

	/* -------------------------------------------- */
	/*  Event Handling                              */
	/* -------------------------------------------- */

	/**
	 * Render the HTML for the ChatMessage which should be added to the log
	 * @returns {Promise<jQuery>}
	 */
	async getHTML() {
		const html = await super.getHTML();
		html[0].classList.add('skyfall');
		if ( this.type == 'usage' ) {
			const actor = fromUuidSync(this.system.actorId);
			html[0].classList.add(actor.type);
			const bgOverlay = document.createElement("div");
			bgOverlay.classList.add("header-overlay");
			bgOverlay.classList.add(actor.type);
			// this.system.
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
		await this.getDocuments();
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
				this._onConsumeResources();
				break;
		}
	}

	/* -------------------------------------------- */
	
	_onConsumeResources(){
		if ( game.userId != this.author.id ) return;
		const content = ""
		const updateData = {};
		const costs = this.system.costs;
		const actor = this._actor;
		
		if ( costs.hp ) {
			const hp = foundry.utils.getProperty(this._actor, 'system.resources.hp');
			updateData['system.resources.hp.value'] = hp.value - costs.hp;
		}
		// costs.ep = this.item.system?.activation?.cost ?? 0;
		if ( costs.ep ) { //costs.ep
			const ep = foundry.utils.getProperty(this._actor, 'system.resources.ep');
			updateData['system.resources.ep.value'] = ep.value - costs.ep;
		}
		if ( costs.catharsis ) {
			const catharsis = foundry.utils.getProperty(this._actor, 'system.resources.catharsis');
			updateData['system.resources.catharsis.value'] = catharsis.value - costs.catharsis;
		}
		if ( costs.shadow ) {
			const shadow = foundry.utils.getProperty(this._actor, 'system.resources.shadow');
			updateData['system.resources.shadow.value'] = shadow.value - costs.shadow;
		}
		// TODO - Potions, Extras
		// Consumable with uses
		if ( costs.uses ) {
			// updateData['items'] ??= [];
		}
		// Consumable
		if ( costs.quantity ) {
			for (const consumeItem of costs.quantity) {
				updateData['items'] ??= [];
				updateData['items'].push({
					_id: consumeItem.id,
					[consumeItem.path]: consumeItem.value
				});
			}
		}
		// SIGIL
		const sigil = this._ability.type == "sigil" ? this._ability : null;
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
		const recharge = this._ability.type == "ability" ? this._ability : null;
		if ( recharge && this._actor.type == 'npc' ) {
			updateData['items'] ??= [];
			updateData['items'].push({
				"_id": recharge.id,
				"system.activation.recharge": 0,
			});
			skyfall.ui.sceneConfig.scene.addCatharsis();
		}
		this._actor.update(updateData);
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

	async #applyCatharsis(event) {
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
		const rollTerms = foundry.dice.terms;
		const button = event.currentTarget;
		const chatCardId = button.closest(".chat-message").dataset.messageId;
		const operator = button.dataset.applyCatharsis;
		const message = game.messages.get(chatCardId);
		const rollTitle = button.closest(".roll-entry").dataset.rollTitle;
		const rollIndex = button.closest(".roll-entry").dataset.rollIndex;
		const roll = message.rolls[rollIndex];
		await roll.applyCatharsis({operator});
		message.system.rolls[rollIndex].template = await roll.render({flavor: roll.options.flavor});
		
		message.updateData = {};
		message.updateData.system = {};
		message.updateData.rolls = message.rolls;
		message.updateData.system.rolls = message.system.rolls;

		
		await message.#prepareUsageHTML();
		if ( !foundry.utils.isEmpty(message.updateData) ) {
			if ( !game.user.isGM && game.userId != this.author.id ) {
				await skyfall.socketHandler.emit("RollCatharsis", {
					id: message.id,
					updateData: message.updateData,
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
				await message.update(message.updateData);
			}
			message.updateData = null;

		}
	}

	async manageCatharsisUpdate() {
		// messageId, updateData
		if ( !game.user.isGM ) return;
		await this.#prepareUsageHTML();
		if ( !foundry.utils.isEmpty(this.updateData) ) {
			await this.update(this.updateData);
			this.updateData = null;
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