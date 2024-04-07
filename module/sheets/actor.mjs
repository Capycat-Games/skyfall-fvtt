import ActorTraits from '../apps/actor-traits.mjs';
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

	/* -------------------------------------------- */

	/** @override */
	getData() {
		const context = super.getData();
		const actorData = context.data;
		context.system = actorData.system;
		context.flags = actorData.flags;
		context.rollData = context.actor.getRollData();
		context.SYSTEM = SYSTEM;
		context.VARIAVEL = true;

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

	_prepareSystemData(context){
		// ABILITIES
		for (let [key, abl] of Object.entries(context.system.abilities)) {
			abl.label = SYSTEM.abilities[key].abbr;
		}

		// SKILLS
		for (let [key, skill] of Object.entries(context.system.skills)) {
			skill.id = key;
			skill.label = skill.custom ? (skill.label || "SKILL") : game.i18n.localize(SYSTEM.skills[key].label);
			skill.icon = [SYSTEM.icons.square, SYSTEM.icons.check, SYSTEM.icons.checkdouble][skill.value];
		}
		// SORT SKILLS
		let coreSkill = Object.values(context.system.skills).filter((p)=> !p.custom);
		let aptitudeSkills = Object.values(context.system.skills).filter((p)=> p.custom);
		context.skills = [...coreSkill.slice(0,2), ...aptitudeSkills, ...coreSkill.slice(2)];
		
		// MOVEMENT
		context.movement = {};
		for (let [key, movement] of Object.entries(context.system.movement)) {
			if ( movement == 0 ) continue;
			if ( !hasProperty(context.movement, key ) ) context.movement[key] = {};
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
		console.log( target, id, document, hasProperty(document, target) );
		if ( !target || !id || !hasProperty(document, target) ) return;
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
		if ( !target || !id || !hasProperty(document, target) ) return;
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
			updateData.system.skills[key] = {label: label, custom: true};
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

	#onActionRoll(button) {
		let target = button.dataset.target;
		let options = {type: target};
		let id;
		if ( target == "init" ) {
			id = 'des';
		} else {
			id = button.closest('.entry').dataset.entryId;
		}
		// new UseConfigDialog({this.actor, id, options});
	}
}
