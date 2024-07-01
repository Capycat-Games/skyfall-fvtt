import ActorTraits from '../apps/actor-traits.mjs';
import ShortRest from '../apps/short-rest.mjs';
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
		return `systems/${SYSTEM.id}/templates/actor/actor-${this.actor.type}.hbs`;
	}
	
	rolling = null;
	filters = {};
	/* -------------------------------------------- */

	/** @override */
	getData() {
		const context = super.getData();
		console.log(context);
		const actorData = context.data;
		context.system = actorData.system;
		context.flags = actorData.flags;
		context.rollData = context.actor.getRollData();
		context.SYSTEM = SYSTEM;
		context.rolling = this.rolling;
		context.filters = this.filters;
		
		// Get Data Fields
		this.#getSystemFields(context);
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
		// Prepare ACTIONS
		this._prepareActions(context);
		// Prepare HitDie
		if ( true ){
			const classes = context.actor.items.filter(it=> it.type == 'class');
			context.hitDies = {value:0, max:0, dies:[]}
			for (const cls of classes) {
				context.hitDies.dies.push({
					...cls.system.hitDie,
					icon: `icons/svg/${cls.system.hitDie.die.replace(/^\d+/,'')}-grey.svg`
				});
			}
			context.hitDies.dies.reduce((acc,hd)=> acc + hd.value, context.hitDies.value );
			context.hitDies.dies.reduce((acc,hd)=> acc + hd.max, context.hitDies.max )
		}
		// Prepare EFFECTS
		context.effects = prepareActiveEffectCategories( this.actor.allApplicableEffects() );
		context.modifications = prepareActiveEffectCategories( this.actor.allApplicableEffects('modification'), 'modification');
		context.statusEffects = CONFIG.statusEffects.reduce((acc, ef)=>{
			const statusData = this.actor.effects.find(e => e.statuses.has(ef.id) );
			ef.disabled = statusData?.disabled ?? true;
			acc.push(ef);
			return acc;
		}, []);
		return context;
	}

	#getSystemFields(context) {
		let system = this.object.system.toObject();
		const schema = this.object.system.schema;
		system = foundry.utils.flattenObject(system);
		
		for (const path of Object.keys(system)) {
			system[path] = schema.getField(path);
		}
		context.systemFields = foundry.utils.expandObject(system);
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
		context.actorHeader.class = [];
		for (const cls of items.classes ) {
			context.actorHeader.class.push({
				id: cls.id,
				name: cls.name,
				level: cls.system.level,
			});
		}
		context.actorHeader.path = [];
		for (const pth of items.paths ) {
			context.actorHeader.path.push({
				id: pth.id,
				name: pth.name,
				// level: cls.system.level,
			});
			// context.actorHeader.path.id = pth.id;
			// context.actorHeader.path.name = pth.name;
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
		for (let [key, skill] of Object.entries(context.system.skills)) {
			skill.id = key;
			skill.label = SYSTEM.skills[key] ? game.i18n.localize(SYSTEM.skills[key].label) : (skill.label || "SKILL");
			skill.icon = [SYSTEM.icons.square, SYSTEM.icons.check, SYSTEM.icons.checkdouble][skill.value];
			skill.type = SYSTEM.skills[key]?.type ?? 'apti' ?? 'custom';
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
		context.abilities = this.document.items.filter( i => ['ability'].includes(i.type));
		context.features = this.document.items.filter( i => ['feature','feat'].includes(i.type));
	}
	_prepareSpells(context) {
		context.spells = this.document.items.filter( i => ['spell'].includes(i.type));
	}

	_prepareActions(context) {
		context.actions = [];
		const filter = this.filters.action;
		// Weapon Attack
		const _weaponAbilities = context.actor.items.filter( i => i.type == 'ability' && i.system.descriptors.includes('weapon') );
		// Attack with Weapon
		const weapons = context.actor.items.filter( i => i.type == 'weapon' || (i.type == 'armor' && i.system.type == 'shield') );
		
		for (const ability of _weaponAbilities) {
			ability.weapons = weapons;
			context.actions.push(ability);
		}
		
		for (const weapon of []) {
			let item = {};
			item.name = weapon.name;
			item.type = 'weapon'; // weapon.type;
			item.id = weapon.id;
			item.img = weapon.img;
			item.abilities = [];
			// const wpnRollData = weapon.getRollData();
			for (const ability of _weaponABL) {
				// const ablRollData = ability.getRollData();
				let action = {};
				action.id = ability.id;
				action.name = ability.name;
				action.action = ability.system._labels.action;
				action.cost = '' //ability.system.activation.cost ? ability.system._labels.cost : '';
				action.extra = '';
				item.abilities.push(action);
			}
			context.actions.push(item);
		}

		const abilities = context.actor.items.filter( i => i.type == 'ability' && !i.system.descriptors.includes('weapon') );
		context.actions.push(...abilities);

		const spells = context.actor.items.filter( i => i.type == 'spell' );
		context.actions.push(...spells);
		
		// Filter
		for (const action of context.actions) {
			action.filtered = (filter && filter!=action.system.action ? 'hidden':'');
		}
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
		html.find("[data-filter]").on('click', this._onClickFilter.bind(this));
		
		new ContextMenu(html, '.window-content .class', [], {
			onOpen: entry => {
				const entryId = entry.dataset.entryId;
				const item = this.document.items.find(it => it.id==entryId);
				if ( !item ) return;
				ui.context.menuItems = [{
					name: "SKYFALL.EDIT",
					icon: "<i class='fas fa-edit fa-fw'></i>",
					condition: () => item.isOwner,
					callback: () => item.sheet.render(true),
				},
				{
					name: "SKYFALL.DELETE",
					icon: "<i class='fas fa-trash fa-fw'></i>",
					condition: () => item.isOwner,
					callback: li => this.document.deleteEmbeddedDocuments( "Item", [item.id] )
				}];
			}
		});

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
		console.log(event);
		button.event = event; //.type; //Pass the trigger mouse click event
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
			case "rest":
				this.#onActionRest(button);
				break;
		}
	}
	async _onClickFilter(event){
		event.preventDefault();
		const button = event.currentTarget;
		const filter = button.dataset.filter;
		const filterId = button.closest('[data-filter-id]').dataset.filterId;
		if ( this.filters[filterId] == filter ) this.filters[filterId] = null;
		else this.filters[filterId] = filter;
		this.render();
	}

	#onActionToggle(button) {
		let target = button.dataset.target;
		let id = button.closest('.entry').dataset.entryId;
		let document = this.actor.items.get(id) ?? this.actor.effects.get(id) ?? this.actor;
		console.log(target, id, document);
		// if ( !document ) this.actor;
		if ( !target || !id ) return;
		if ( target == 'effect' && SYSTEM.conditions[id] ) {
			this.actor.toggleStatusEffect( id );
		} else if ( foundry.utils.hasProperty(document, target) ) {
			const updateData = {};
			updateData[target] = !foundry.utils.getProperty(document, target);
			document.update(updateData);
		}
	}

	#onActionVary(button) {
		let target = button.dataset.target;
		let id = button.closest('.entry').dataset.entryId;
		// TODO CHANGE ITEM
		let document = this.actor.items.get(id) ?? this.actor;
		if ( !target || !id || !foundry.utils.hasProperty(document, target) ) return;
		let updateData = {};
		updateData[target] = Number(foundry.utils.getProperty(document, target));
		button.event.type == 'click' ? updateData[target]++ : updateData[target]-- ;
		document.update(updateData);
		// this.render();
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
		let create = button.dataset.create;
		if ( !create ) return;
		if ( create == "skill" ) {
			let type = 'custom'; //taget.dataset.type;
			const label = await Dialog.prompt({
				title: game.i18n.localize("SKYFALL.SHEET.NEWSKILL"),
				content: `<form><div class="form-group"><label>${game.i18n.localize("SKYFALL.SHEET.NAME")}</label><input type="text" name="skill" value="Pericia"></div></form>`,
				callback: html => {
					return html[0].querySelector('input').value
				},
				options: {width: 260}
			});
			
			let key = label.slice(0,4).toLowerCase();
			
			let updateData = {system: {skills: {}}};
			updateData.system.skills[key] = {label: label, type: type, value: 1};

			if ( SYSTEM.skills[key]?.type == 'apti' ) {
				updateData.system.skills[key].label = null;
			} else if ( key in this.actor.system.skills ) return ui.notifications.warn("SKYFALL.ALERTS.DUPLICATESKILL");
			
			await this.actor.update(updateData);
		} else if ( create == "ActiveEffect" ) {
			let type = button.closest('section')?.dataset?.type ?? 'base';
			let category = button.dataset.category;
			
			const effectData = {
				type: type,
				name: game.i18n.format("DOCUMENT.Create", {
					type: game.i18n.localize(`TYPES.ActiveEffect.${type}`)
				}),
				img: ['modification','sigil'].includes(type) ? 'icons/svg/upgrade.svg' : 'icons/svg/aura.svg',
				disabled: category == 'inactive',
				duration: category == 'temporary' ? {rounds:1} : {},
			}

			this.document.createEmbeddedDocuments( create, [effectData] );
		} else {
			let type = button.closest('section')?.dataset?.type ?? 'feature';
			this.document.createEmbeddedDocuments( create, [{name:"NOVO ITEM", type: type }] );
		}
	}

	#onActionDelete(button) {
		const _delete = button.dataset.delete;
		const id = button.closest('.entry').dataset.entryId;
		console.log(_delete, id);
		if ( !_delete || !id ) return;
		if ( _delete == "skill" ) {
			let deletekey = {system:{skills:{}}};
			deletekey.system.skills[`-=${id}`] = null;
			this.document.update(deletekey);
		} else {
			this.document.deleteEmbeddedDocuments( _delete, [id] );
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

	async #onActionUse(button) {
		let target = button.dataset.target;
		let id = button.closest('.entry').dataset.entryId;
		let withId = button.dataset.itemId;
		// let id = button.dataset.itemId;
		console.log(button.event);
		if ( withId != id ) {}
		const ability = this.actor.items.get(id);
		if ( !ability ) return;
		const item = this.actor.items.get(withId);
		const skipUsageConfig = game.settings.get('skyfall','skipUsageConfig');
		const skip = ( skipUsageConfig=='shift' && button.event.shiftKey) || ( skipUsageConfig=='click' && !button.event.shiftKey);
		await ChatMessage.create({
			type: 'usage',
			flags: {
				skyfall: {
					advantage: button.event.ctrlKey ? 1 : 0,
					disadvantage: button.event.altKey ? 1 : 0,
				}
			},
			system: {
				actorId: this.actor.id,
				abilityId: ability.id,
				itemId: item.id,
			}}, {skipConfig: skip});
		return;
		
		const usageData = {
			...CONFIG.ChatMessage.dataModels.usage.schema.initial(),
			abilityId: ability.id,
			itemId: item ? item.id : null,
			abilityState: ability.toObject(),
			itemState: item ? item.toObject() : null,
			actorState: ability.parent.toObject(),
			item: ability.toObject(),
			targets: [ ...game.user.targets.map( token => token.document.uuid ) ]
		};
		usageData.abilityState.system._labels = {...ability.system._labels};
		if ( item ) {
			usageData.itemState.system._labels = {...item.system._labels};
		}
		// usageData.item.system._labels = {...ability.system._labels};

		const templateData = {
			usage: usageData,
		}
		let template = `systems/${SYSTEM.id}/templates/chat/usage.hbs`;
		const html = await renderTemplate(template, templateData);

		const messageData = {
			type: "usage",
			content: html,
			system: usageData,
			speaker: ChatMessage.getSpeaker({actor: this}),
		}

		ChatMessage.applyRollMode(messageData, game.settings.get('core','rollMode'))
		const message = await ChatMessage.create(messageData);
		message.usageConfigurePhase();
		
	}

	async #onActionRoll(button) {
		// let target = button.dataset.type;
		let type = button.closest('.entry').dataset.type;
		let id = button.closest('.entry').dataset.entryId;
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
		this.render(true);
	}

	async #onActionRest(button) {
		const rest = button.dataset.rest;
		switch (rest) {
			case 'short':
				return new ShortRest(this.actor, {actor: this.actor}).render(true);
			case 'long':
			default:
				return this.actor.longRest();
		}
	}
	
}
