import ActorTraits from '../apps/actor-traits.mjs';
import D20Roll from '../dice/d20-roll.mjs';
import {
	onManageActiveEffect,
	prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export default class SkyfallActorSheet extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ['skyfall', 'sheet', 'actor'],
			width: 800,
			height: 600,
			tabs: [
				{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'face'},
			],
		});
	}

	/** @override */
	get template() {
		return `systems/skyfall/templates/actor/actor-${this.actor.type}.hbs`;
	}
	rolling = null;
	/* -------------------------------------------- */

	/** @override */
	getData() {
		const context = super.getData();
		const actorData = context.data;
		context.system = actorData.system;
		context.flags = actorData.flags;
		context.rollData = context.actor.getRollData();
		context.SYSTEM = SYSTEM;
		context.rolling = this.rolling;
		context.VARIAVEL = true;

		// Prepare header data
		this._prepareHeaderData(context);
		// Prepare data
		this._prepareSystemData(context);
		// Prepare INVENTORY Inventory
		this._prepareInventory(context);
		// Prepare ABILITIES
		this._prepareAbilities(context);
		// Prepare SPELLS
		this._prepareSpells(context);
		// Prepare EFFECTS
		context.effects = prepareActiveEffectCategories(
			this.actor.allApplicableEffects()
		);
		return context;
	}

	_prepareHeaderData(context){
		const items = {};
		items.legacy = context.actor.items.find(i => i.type == 'legacy');
		items.curse = context.actor.items.find(i => i.type == 'curse');
		items.background = context.actor.items.find(i => i.type == 'background');
		items.classes = context.actor.items.filter(i => i.type == 'class');
		items.paths = context.actor.items.filter(i => i.type == 'path');
		
		context.actorHeader = {};
		context.actorHeader.legacy = {};
		if ( items.legacy ) {
			context.actorHeader.legacy.id = items.legacy.id;
			context.actorHeader.legacy.name = items.legacy.name;
			let heritage = Object.values(items.legacy.system.heritages).find(i => i.chosen );
			context.actorHeader.legacy.heritage = heritage?.name ?? 'N/A';
		}
		context.actorHeader.curse = {};
		if ( items.curse ) {
			context.actorHeader.curse.id = items.curse.id;
			context.actorHeader.curse.name = items.curse.name;
		}
		context.actorHeader.background = {};
		if ( items.background ) {
			context.actorHeader.background.id = items.background.id;
			context.actorHeader.background.name = items.background.name;
		}
		context.actorHeader.class = {};
		for (const cls of items.classes ) {
			// TODO MANAGE MULTICLASS
			context.actorHeader.class.id = cls.id;
			context.actorHeader.class.name = cls.name;

			// context.actorHeader.class.id = [];
			// context.actorHeader.class.id.push(cls.id);
			// context.actorHeader.class.name = [];
			// context.actorHeader.class.name.push(cls.name);
		}
		context.actorHeader.path = {};
		for (const pth of items.paths ) {
			// TODO MANAGE MULTIPATH
			context.actorHeader.path.id = pth.id;
			context.actorHeader.path.name = pth.name;
			// context.actorHeader.path.id = [];
			// context.actorHeader.path.id.push(pth.id);
			// context.actorHeader.path.name = [];
			// context.actorHeader.path.name.push(pth.name);
		}
	}

	_prepareSystemData(context){
		// ABILITIES
		for (let [key, abl] of Object.entries(context.system.abilities)) {
			abl.label = SYSTEM.abilities[key].abbr;
		}

		// SKILLS
		console.log( context.system.skills );
		for (let [key, skill] of Object.entries(context.system.skills)) {
			skill.id = key;
			skill.label = skill.type ? (skill.label || "SKILL") : game.i18n.localize(SYSTEM.skills[key].label);
			skill.icon = [SYSTEM.icons.square, SYSTEM.icons.check, SYSTEM.icons.checkdouble][skill.value];
			skill.type = SYSTEM.skills[key].type;
		}
		// SORT SKILLS
		let coreSkill = Object.values(context.system.skills).filter((p)=> !p.custom);
		let aptitudeSkills = Object.values(context.system.skills).filter((p)=> p.custom);
		context.skills = [...coreSkill.slice(0,2), ...aptitudeSkills, ...coreSkill.slice(2)];
		
		context.system.initiative = context.system.abilities.dex.value;
		// MOVEMENT
		context.movement = {};
		for (let [key, movement] of Object.entries(context.system.movement)) {
			if ( movement == 0 ) continue;
			if ( !foundry.utils.hasProperty(context.movement, key ) ) context.movement[key] = {};
			context.movement[key].value = movement;
			context.movement[key].label = SYSTEM.movement[key].label;
			context.movement[key].icon = SYSTEM.icons[key];
		}
		// LANGUAGES
		context.languages = Object.values(SYSTEM.languages).filter(i => context.system.languages.includes(i.id) ).map(i => i.label);
		
		// PROFICIENCIES
		context.proficiencies = Object.values({...SYSTEM.weapons, ...SYSTEM.armors}).filter(i => context.system.proficiencies.includes(i.id) ).map(i => i.label);
	}

	/**
	 * Item Organization
	 */
	_prepareInventory(context) {
		const list = ['weapon','armor','equipment','vestiment','loot','consumable','']
		context.inventory = context.items.filter( i => list.includes(i.type));
	}

	_prepareAbilities(context) {
		context.abilities = context.items.filter( i => ['ability'].includes(i.type));
		context.features = context.items.filter( i => ['feature','feat'].includes(i.type));
	}
	_prepareSpells(context) {
		context.spells = context.items.filter( i => ['spell'].includes(i.type));
	}

	/* -------------------------------------------- */

	/* -------------------------------------------- */
	/*  Event Listeners and Handlers                */
	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		html.find("[data-action]").on('click contextmenu', this._onClickControl.bind(this));
		html.find("[data-action]").change(this._onChangeControl.bind(this));
	}
	/**
	* Handle click events on a sheet control button.
	* @param {PointerEvent} event   The originating click event
	* @protected
	*/
	async _onChangeControl(event) {
		event.preventDefault();
		const button = event.currentTarget;
		switch ( button.dataset.action ) {
			case "update":
				this.#onActionUpdate(button);
				break;
		}
	}
	/**
	* Handle click events on a sheet control button.
	* @param {PointerEvent} event   The originating click event
	* @protected
	*/
	async _onClickControl(event) {
		event.preventDefault();
		const button = event.currentTarget;
		button.event = event.type; //Pass the trigger mouse click event
		switch ( button.dataset.action ) {
			case "toggle":
				this.#onActionToggle(button);
				break;
			case "vary":
				this.#onActionVary(button);
				break;
			case "manage":
				this.#onActionManage(button);
				break;
			case "create":
				this.#onActionCreate(button);
				break;
			case "delete":
				this.#onActionDelete(button);
				break;
			case "edit":
				this.#onActionEdit(button);
				break;
			case "use":
				this.#onActionUse(button);
				break;
			case "roll":
				this.#onActionRoll(button);
				break;
		}
	}

	#onActionToggle(button) {
		let target = button.dataset.target;
		let id = button.closest('.entry').dataset.entryId;
		let document = this.actor.items.get(id) ?? this.actor;
		// if ( !document ) this.actor;
		if ( !target || !id || !foundry.utils.hasProperty(document, target) ) return;
		const updateData = {};
		updateData[target] = !getProperty(document, target);
		console.log(updateData);
		document.update(updateData);
		this.render();
	}

	#onActionVary(button) {
		let target = button.dataset.target;
		let id = button.closest('.entry').dataset.entryId;
		// TODO CHANGE ITEM
		let document = this.actor.items.get(id) ?? this.actor;
		console.log(target, id, document);
		if ( !target || !id || !foundry.utils.hasProperty(document, target) ) return;
		let updateData = {};
		updateData[target] = Number(getProperty(document, target));
		button.event == 'click' ? updateData[target]++ : updateData[target]-- ;
		document.update(updateData);
		this.render();
	}

	#onActionManage(button) {
		let target = button.dataset.target;
		switch (target) {
			case "modifiers-damage.dealt":
			case "modifiers-damage.taken":
				target = target.split('-')[1];
				return new ActorTraits(this.actor, target).render(true);
			case "other":
					// return new TraitSelector(this.actor, options).render(true);
					return;
			case "movement":
			case "languages":
			case "proficiencies":
			default:
				return new ActorTraits(this.actor, target).render(true);
		}
	}

	#onActionUpdate(button) {
		let target = button.dataset.target;
		let id = button.closest('.entry').dataset.entryId;
		let item = this.actor.items.get(id);
		if ( !target || !id || !item ) return;
		let updateData = {};
		updateData[target] = button.value;
		item.update(updateData);
	}

	async #onActionCreate(button) {
		let target = button.dataset.target;
		let id = button.closest('.entry').dataset.entryId; //TYPE
		if ( !target || !id  ) return;
		if ( target == "skill" ) {
			let type = 'apti'; //taget.dataset.type;
			const label = await Dialog.prompt({
				title: game.i18n.localize("SKYFALL.SHEET.NEWSKILL"),
				content: `<form><div class="form-group"><label>${game.i18n.localize("SKYFALL.SHEET.NAME")}</label><input type="text" name="skill" value="Pericia"></div></form>`,
				callback: html => {
					return html[0].querySelector('input').value
				},
				options: {width: 260}
			});
			
			let key = label.slice(0,4).toLowerCase();
			if ( key in this.actor.system.skills ) return ui.notifications.warn("SKYFALL.ALERTS.DUPLICATESKILL");
			// "JÁ EXISTE UMA PERICIA COM A MESMA KEY (4 PRIMEIRAS LETRAS)"
			let updateData = {system: {skills: {}}};
			updateData.system.skills[key] = {label: label, type: type};
			await this.actor.update(updateData);
		} else {
			const embedded = ( target == "effect" ? "ActiveEffect" : "Item" );
			this.actor.createEmbeddedDocuments( embedded, [{name:"NOVO ITEM", type: target }] );
		}
	}

	#onActionDelete(button) {
		let target = button.dataset.target;
		let id = button.closest('.entry').dataset.entryId;
		if ( !target || !id ) return;
		if ( target == "skill" ) {
			let deletekey = {system:{skills:{}}};
			deletekey.system.skills[`-=${id}`] = null;
			this.actor.update(deletekey);
		} else {
			const embedded = ( target == "effect" ? "ActiveEffect" : "Item" );
			this.actor.deleteEmbeddedDocuments( embedded, [id] );
		}
	}

	#onActionEdit(button) {
		let target = button.dataset.target;
		let id = button.closest('.entry').dataset.entryId;
		let item;
		if ( !target || !id ) return;
		if ( target == "effect" ) item = this.actor.effects.get(id);
	  else item = this.actor.items.get(id);
		if ( !item ) return;
		item.sheet.render(true)
	}

	#onActionUse(button) {
		let target = button.dataset.target;
		let id = button.closest('.entry').dataset.entryId;
		
		// new UseConfigDialog({this.actor, id,options});
	}

	async #onActionRoll(button) {
		// let target = button.dataset.type;
		let type = button.closest('.entry').dataset.type;
		let id = button.closest('.entry').dataset.entryId;
		console.log( 'ROLLING', this.rolling );
		console.log(id, type);
		if ( button.event == 'contextmenu' ) {
			this.rolling = null;
			return this.render(true);
		}
		
		if ( type == 'levelHitDie' ) {
			return;
		} else if ( type == 'healHitDie' ) {
			return;
		} else if ( type == 'deathSave' ) {
			return;
		}
		if ( !this.rolling ) {
			if ( type == 'ability') this.rolling = {type:null, id: null, abl: id};
			else this.rolling = {type: type, id: id, abl: null};
		} else if ( this.rolling.type && type !== 'ability' ) {
			this.rolling = {type: type, id: id, abl: null};
		} else if ( this.rolling.type && type == 'ability' ) {
			this.rolling.abl = id;
		} else {
			this.rolling.type = type;
			this.rolling.id = id;
		}
		if ( this.rolling.abl && this.rolling.type && this.rolling.id ) {
			await this.actor.rollCheck(this.rolling);
			this.rolling = null;
		}
		console.log( 'ROLLING', this.rolling );
		this.render(true);
	}

	async #OldonActionRoll(button) {
		return;

		let rollConfig = {
			// types: [type, id],
			types: {[type]: id}, // abl: '', skill: '', initiative: true, movement: true
			advantage: 0,
			disadvantage: 0,
			terms: [ {term: '1d20', options: {flavor: '', name: 'd20', source: ''}}, ],
			rollData: rollData,
		}
		if ( type == 'ability') {
			if ( this.rolling == id ) {
				rollConfig.terms = [ ...rollConfig.terms,
					{term: '@abl', options: {flavor: '', name: 'ability', source: ''}},
				];
				rollData['abl'] = rollData.abilities[id].value;
			} else { 
				this.rolling = id;
				this.rooooooling = new D20Roll('1d20', rollData, {type:null,id:null,abl:null});
				return this.render(true);
			}
		} else if ( type == 'skill') {
			rollConfig.types.ability = this.rolling ?? 'str';
			rollConfig.terms = [ ...rollConfig.terms,
				{term: '@prof', options: {flavor: '', name: 'proficiency', source: ''}},
				{term: '@abl', options: {flavor: '', name: 'ability', source: ''}},
			];
			rollData['prof'] = rollData.proficiency * rollData.skills[id].value;
			rollData['abl'] = rollData.abilities[this.rolling ?? 'str'].value;
		} else if ( type == 'initiative' ) {
			rollConfig.types.ability = this.rolling ?? id;
			rollConfig.terms = [ ...rollConfig.terms,
				{term: '@abl', options: {flavor: '', name: 'ability', source: ''}},
			];
			rollData['abl'] = rollData.abilities[this.rolling ?? id].value;
		} else if ( type == 'movement' ) {
			rollConfig.types.ability = this.rolling ?? id;
			rollConfig.terms = [ ...rollConfig.terms,
				{term: '@abl', options: {flavor: '', name: 'ability', source: ''}},
			];
			rollData['abl'] = rollData.abilities[this.rolling ?? id].value;
		}
		
		
		const roll = D20Roll.fromConfig( rollConfig );
		console.log({title:"SKYFALL.ROLL.ABILITY", type:type, ability: id});
		await roll.configureDialog({title:"SKYFALL.ROLL.ABILITY", type:type, ability: id});
		await roll.toMessage();
		this.rolling = null;
		return;
		if ( !this.rolling && !this.rollAbl ) {
			if ( type == 'ability' ) this.rollAbl = id;
			else this.rolling = type;
		} else if ( this.rolling && !this.rollAbl  ) {
			if ( type !== 'ability' ) this.rolling = type;
			else this.rollAbl = id;
		} else if ( !this.rolling && this.rollAbl ) {
			if ( type == 'ability' ) {}
			else if ( type == 'skill' ) {}
			else if ( type == 'initiative' ) {}
			else if ( type == 'movement' ) {}
		}
		if ( !complete ) return;
		this.rolling = null;
		this.rollAbl = null;
	}
}
