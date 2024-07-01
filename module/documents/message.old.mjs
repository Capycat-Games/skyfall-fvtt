import D20Roll from "../dice/d20-roll.mjs";

export default class SkyfallMessageOLD extends ChatMessage {
	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @override */
	prepareData() {
		super.prepareData();
		console.log(`${this.documentName}.prepareData()`);
	}

	/** @override */
	prepareBaseData() {
		super.prepareBaseData();
		console.log(`${this.documentName}.prepareBaseData()`);
		switch (this.type) {
			case 'usage':
				this.prepareUsageData();
				break;
		}
	}

	/** @override */
	prepareDerivedData() {
		super.prepareDerivedData();
		console.log(`${this.documentName}.prepareDerivedData()`);

		switch (this.type) {
			case 'usage':
				this.prepareUsageDerivedData();
				break;
		}
	}
	
	/* -------------------------------------------- */

	/**
	 * Prepare Usage type specific data
	 */
	prepareUsageData() {
		const messageData = this;
		const systemData = messageData.system;
		const flags = messageData.flags.skyfall || {};
	}
	
	/* -------------------------------------------- */

	/**
	 * Prepare Usage type specific derived data
	 */
	prepareUsageDerivedData() {
		const messageData = this;
		const systemData = messageData.system;
		const flags = messageData.flags.skyfall || {};

		if ( systemData.status.phase == 1 ) {

		}
	}

	/* -------------------------------------------- */
	/*  Database Workflows                          */
	/* -------------------------------------------- */

	/** @inheritDoc */
	async _preCreate(data, options, user) {
		console.warn(this.system.item);
		await super._preCreate(data, options, user);
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _onCreate(data, options, user) {
		await super._onCreate(data, options, user);
		// Renders Item Usage config
		if ( data.type == 'usage' && user == data.author ) {
			await this.usageConfigurePhase();
			this.sheet.render(true);
		}
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _preUpdate(data, options, userId) {
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
		if ( this.type == "usage" && !options.configured ) this.usageConfigurePhase();
	}

	/* -------------------------------------------- */
	/*  Event Handling                              */
	/* -------------------------------------------- */
	
	/**
	 * Render the HTML for the ChatMessage which should be added to the log
	 * @returns {Promise<jQuery>}
	 */
	async getHTML() {
		const html = await super.getHTML();
		
		if ( this.type == 'usage' ) {
			const bgOverlay = document.createElement("div");
			bgOverlay.classList.add("header-overlay");
			html.prepend( bgOverlay );
			if ( this.system.modifications ){
				let mods = Object.values(this.system.modifications);
				// mods = mods.map(m => `<li>@Embed[${m.uuid}]</li>`).join('');
				// let modslist = await TextEditor.enrichHTML(mods);
				// $(html).find('ul.modifications').html(modslist);
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
		this._damageApplyButtons(html);

		this.activateListeners(html);
		
		const itemName = html.find('.card-header > .item-name');
		if( itemName.text().length <= 10 ) itemName.addClass("fonts22");
		else if ( itemName.text().length <= 15 ) itemName.addClass("fonts20");
		else if ( itemName.text().length <= 20 ) itemName.addClass("fonts18");
		else if ( itemName.text().length <= 25 ) itemName.addClass("fonts16");
		else if ( itemName.text().length <= 30 ) itemName.addClass("fonts14");
		else itemName.addClass("fonts12");
		
		console.warn( itemName );

		return html;
	}

	
	/**
	 * Render Action Buttons Over roll-template
	 */
	_damageApplyButtons(html){
		let chatHTML = html.find(".message-content");
		let noButtons = chatHTML.find(".rest-card");
		if ( noButtons ) return;
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
			}
		}
		
		// Get Element To Append to;
		let damageRolls = chatHTML.querySelectorAll('.evaluated-roll:not(.D20Roll)');
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
		let diceRolls = chatHTML.querySelectorAll('.evaluated-roll');
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
		button.event = event.type; //Pass the trigger mouse click event
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
				
				break;
		}
	}

	/* -------------------------------------------- */


	#applyDamage(event) {
		event.preventDefault();
		const button = event.currentTarget;
		button.event = event.type; //Pass the trigger mouse click event
		const modifier = Number(button.dataset.applyDamage);
		const damage = button.closest('.evaluated-roll').querySelector('.dice-total').innerText;

		const chatCardId = button.closest(".chat-message").dataset.messageId;
		const message = game.messages.get(chatCardId);
		const rollTitle = button.closest(".evaluated-roll").dataset.rollTitle;
		const roll =  message.rolls.find( r => r.options.flavor == rollTitle && r.options.types.includes('damage') );
		
		for (const token of canvas.tokens.controlled) {
			token.actor.applyDamage( roll , modifier, true );
		}
	}

	async #applyCatharsis(event) {
		event.preventDefault();
		const rollTerms = foundry.dice.terms;
		const button = event.currentTarget;
		const chatCardId = button.closest(".chat-message").dataset.messageId;
		const operator = button.dataset.applyCatharsis;
		const message = game.messages.get(chatCardId);
		const rollTitle = button.closest(".evaluated-roll").dataset.rollTitle;
		const rollIndex = message.rolls.findIndex( r => r.options.flavor == rollTitle );
		const roll = message.rolls.find( r => r.options.flavor == rollTitle );
		const terms = [new rollTerms.OperatorTerm({operator: operator}), new rollTerms.Die({number:1, faces:6})];
		terms.map(t => t.evaluate());
		roll.terms = roll.terms.concat( terms );
		roll._formula = roll.constructor.getFormula(roll.terms);
		await roll._evaluate();
		message.system.rolls[rollIndex].template = await roll.render({flavor: roll.options.flavor});
		const updateData = {
			rolls: message.rolls,
			"system.rolls": message.system.rolls,
		}
		this.update(updateData);

	}

	async #applyRest(event){
		event.preventDefault();
		console.log("applyRest", event);
		const button = event.currentTarget;
		const actorId = button.closest('.rest-card').dataset.actorId;
		const actor = game.actors.get(actorId);
		const messageId = button.closest('.chat-message').dataset.messageId;
		const message = game.messages.get(messageId);
		if ( !actor || actor.isOwnser ) return;
		console.log("applyRest", actor, message);
		actor.shortRest(message);
	}

	/**
	* Retrieve AbilityTemplate data and Draw on Canvas
	* @param {Event} event   The originating click event
	* @private
	*/
	async #placeTemplate(event) {
		event.preventDefault();
		console.log(event);
		console.log(this);
		const button = event.currentTarget;
		const message = this;
		const item = message.system.item;
		if( !item ) return;
		const template = game.skyfall.canvas.AbilityTemplate.fromItem(item);
		console.log(template);
		if ( template ) {
			template.drawPreview();
		}
	}

	/* -------------------------------------------- */
	/* Usage Message Processing                     */
	/* -------------------------------------------- */
	
	async usageRenderTemplate(){
		console.warn("usageRenderTemplate",this);
		const templateData = {
			usage: this.system,
		}
		let template = `systems/${SYSTEM.id}/templates/chat/usage.hbs`;
		const html = await renderTemplate(template, templateData);
		return html;
	}

	async usageConfigurePhase(){
		if ( this.type != 'usage' ) return;
		if ( this.system.status.phase > 1 ) return;
		
		const rolls = [];
		const templates = [];
		const _ability = this.system.abilityState;
		const _item = this.system.itemState;
		console.warn( 'usageConfigurePhase' , _ability , _item );
		// MERGE _item INTO _ability
		this.#configureMergeItem(_ability, _item, rolls );
		// Configure Rolls
		this.#configureItem(_ability, rolls, templates);

		// APPLY MOFIDICATIONS into tempItem
		const appliedMod = this.system.modifications;
		console.log(this.system.modifications);
		for ( const [id, quantity] of Object.entries(appliedMod) ) {
			this.#configureApplyModification( _ability, id, quantity );
		}

		const tempItem = new Item(_ability);
		const finalData = tempItem.toObject();
		
		
		
		finalData.system._labels = tempItem.system._labels;

		// Re-render template
		const html = await this.usageRenderTemplate();
		this.update({
			"system.item": finalData,
			"system.rolls": rolls,
			"system.measuredTemplate": templates,
			content: html }, {configured: true });
	}
	
	#configureMergeItem( ability, item, rolls ){
		if ( !item ) return;
		const abl = ability.system;
		const itm = item.system;
		
		// Group Descriptors
		if ( itm ) abl.descriptors = abl.descriptors.concat( itm.descriptors );
		let dmgDesc = abl.descriptors.filter( d => SYSTEM.DESCRIPTOR.DAMAGE[d] );
		dmgDesc = new Set(dmgDesc);
		dmgDesc = [...dmgDesc];

		if ( ['weapon','equipment'].includes(item.type) && abl.attack ) {
			abl.attack.damage = abl.attack.damage.replace('@item', itm.damage.formula);
		}
		if ( false && ['weapon','equipment'].includes(item.type) &&  abl.attack ) {
			const attack = abl.attack;
			const terms = [ {term: '1d20', options: {flavor: '', name: 'd20', source: ''}}, ];
			const rollData = this.getRollData();
			terms.push( {term: `${attack.type}`, options: {flavor: '', name: 'ability', source: ''}} );
			terms.push( {term: `@prof`, options: {flavor: '', name: 'proficiency', source: ''}} );
			rollData['prof'] = rollData.proficiency;

			let rollConfig = {
				advantage: 0, disadvantage: 0,
				rollData: rollData,
				terms: terms,
			}
			
			const roll = D20Roll.fromConfig( rollConfig );
			roll.configureRoll();
			roll.options.flavor = "Ataque";
			roll.options.types = ["attack"];
			rolls.push( roll.toJSON() );

			rollData['item'] = itm.damage.formula;
			const damageRoll = new RollSF( attack.damage, rollData );

			for (const term of damageRoll.terms) {
				term.options.flavor ??=  dmgDesc[0] ?? 'slashing';
			}
			damageRoll.options.flavor = "Dano";
			damageRoll.options.types = ["damage"];
			rolls.push( damageRoll.toJSON() );
		}

		if ( ['weapon','equipment'].includes(item.type) && abl.range.descriptive == "@item" ) {
			abl.range.value = itm.range;
			abl.range.descriptive = `${abl.range.value}${abl.range.units}`;
		}
	}
	
	#configureItem( ability, rolls, templates ){
		console.log('configureItem');
		// PREPARE ROLLS
		const abl = ability.system;

		// Group Descriptors
		let dmgDesc = abl.descriptors.filter( d => SYSTEM.DESCRIPTOR.DAMAGE[d] );
		dmgDesc = new Set(dmgDesc);
		dmgDesc = [...dmgDesc];
		console.log(abl);
		if ( abl.attack?.hit ) {
			const attack = abl.attack;
			const terms = [ {term: '1d20', options: {flavor: '', name: 'd20', source: ''}}, ];
			const rollData = this.getRollData();
			terms.push( {term: `${attack.type}`, options: {flavor: '', name: 'ability', source: ''}} );
			terms.push( {term: `@prof`, options: {flavor: '', name: 'proficiency', source: ''}} );
			rollData['prof'] = rollData.proficiency;

			let rollConfig = {
				advantage: 0, disadvantage: 0,
				rollData: rollData,
				terms: terms,
			}
			
			const roll = D20Roll.fromConfig( rollConfig );
			roll.configureRoll();
			roll.options.flavor = "Ataque";
			roll.options.types = ["attack"];
			rolls.push( roll.toJSON() );

			const damageRoll = new RollSF( attack.damage, rollData );

			for (const term of damageRoll.terms) {
				term.options.flavor ??=  dmgDesc[0] ?? 'slashing';
			}
			damageRoll.options.flavor = "Dano";
			damageRoll.options.types = ["damage"];
			rolls.push( damageRoll.toJSON() );
		}

		// PREPARE TEMPLATE
		if ( abl.target.shape ) {
			templates.push({t: abl.target.shape});
		}
	}

	#configureApplyModification( ability, id, mod) {
		console.warn("configureApplyModification", id, mod);
		const actor = game.actors.get(this.system.actorState._id);
		if ( !actor ) return;
		const modification = actor.allModifications.find(m => m.id == id);
		console.log(modification);
		this.system.modifications[id].uuid = modification.uuid;
		this.system.modifications[id].name = modification.name;
		this.system.modifications[id].cost = modification.system.cost.value * Number(mod.apply);
		this.system.modifications[id].resource = modification.system.cost.resource;
		this.system.modifications[id].apply = Number(mod.apply);
	}
	
	async usageExecutePhase(){
		// Roll Attack/Check Dice
		const item = this.system.item;
		const rolls = this.system.rolls;
		const executed = [];
		let criticalHit = false;
		for (const [i, roll] of this.system.rolls.entries() ) {
			let r = RollSF.fromData(roll);

			if ( r.options.types?.includes('damage') && criticalHit ) {
				r.alter(2);
			}
			await r.evaluate();
			this.system.rolls[i] = r.toJSON();
			if ( roll.class == "D20Roll" && r.options.amplify && r.dice[0].total >= 15 ) {
				r.options.flavor += " Ampliado";
				// ADD APLIFY EFFECTS
			}
			
			this.system.rolls[i].template = await r.render({flavor: r.options.flavor});

			if ( r.options.types?.includes('attack') && r.dice[0].total == 20 ) {
				criticalHit = true;
				r.options.critical = true;
			}
			if ( r.options.types?.includes('attack') && r.dice[0].total == 1 ) {
				r.options.fumble = true;
			}
			
			executed.push(r);
		}
		
		await this.update({"system.rolls": this.system.rolls,"rolls": executed}, {configured: true});
		if ( executed ){
			AudioHelper.play({
				src: CONFIG.sounds.dice,
				volume: 1,
				autoplay: true,
				loop: false
			}, true);
		}
		// APPLY AMPLIFY
		// Roll Damage / Dice
		// Create and Place Templates
		// configureEffects
		
		// Prepare EFFECTS
		const applycableEffects = this.system.effects;
		for ( const eff of applycableEffects ) {
			this.#configureEffects( _ability, eff );
		}
		// return;
		// Re-render template
		const html = await this.usageRenderTemplate();
		// COMMIT Resources spended
		this.update({"system.status.phase": 3, content: html }, {configured: true});
	}

	#configureEffects( ability, modifications) {

	}

	/* -------------------------------------------- */
	/*  Importing and Exporting                     */
	/* -------------------------------------------- */

	/**
	 * Export the content of the chat message into a standardized log format
	 * @returns {string}
	 */
	// export() {}
	#RETHINK (){
		"SHEET.ACTION.USE"
		function actionUSE() {
			options = {};
			system.actorUUID = actor.uuid;
			system.abilityUUID = ability.uuid;
			system.itemUUID = item.uuid;
			
			options.skip = SHIFT ? true : false;
			options.advantage = ALT ? true : false;
			options.desadvantage = CNTRL ? true : false;
		}
		Message.create(data, options);
		"MESSAGE.onCreate()"
		function messageOnCreate() {
			//APPLYITEMTOABILITY
			//PREPAREMODS
			//PREPAREROLLS
			//PREPAREAREATEMPLATES
			//PREPAREEFFECTS
			if (SKIP) {
				// EXECUTEROLLS
				// LOCK
			}
			// system: 
		}
		// ON USE, ON ROLL ATTACK, ON ROLL DAMAGE
		"USAGECONFIG.RENDER"
		function usageConfigRender() {
			getValidModifications()
			getRolls()
		}

	}
}