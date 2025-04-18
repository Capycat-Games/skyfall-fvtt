const {HandlebarsApplicationMixin, ApplicationV2} = foundry.applications.api;

import D20Roll from "../../dice/d20-roll.mjs";
import SkyfallRoll from "../../dice/skyfall-roll.mjs";

export default class ModificationConfig extends HandlebarsApplicationMixin(ApplicationV2) {
	constructor(data, options){
		super(options);

		// init
		this.manage = data;
	}
	manage = {};

	/** @override */
	static DEFAULT_OPTIONS = {
		id: 'modification-config',
		tag: "form",
		form: {
			handler: ModificationConfig.#onSubmit,
			closeOnSubmit: true,
			submitOnChange: false,
		},
		window: {
			title: "SKYFALL2.APP.ModificationConfig",
			frame: true,
			positioned: true,
		},
		classes: ["skyfall", "sheet", "modification-config"],
		position: {
			width: 600, height: 'auto',
			// top: 220, left: 120,
		},
		actions: {
			applyVary: {handler: ModificationConfig.#applyVary, buttons: [0]},
			applyToggle: {handler: ModificationConfig.#applyToggle, buttons: [0]},
		},
	};

	/** @override */
	static PARTS = {
		content: {
			template: "systems/skyfall/templates/v2/apps/modification-config.hbs",
			id: "content",
			scrollable: [".modifications"],
		},
		footer: {
			template: "templates/generic/form-footer.hbs"
		}
	}
	
	/* -------------------------------------------- */
	/*  Factory Methods                             */
	/* -------------------------------------------- */

	static async fromData(data, options){
		const { appliedMods, effects } = data;
		const createData = {}
		const actor = fromUuidSync(data.actor)?.clone({}, {keepId: true});
		// const ability = actor.items.get(data.ability);
		const ability = ( data.check ? new Item(SYSTEM.prototypeItems.ABILITYROLL) : actor.items.get(data.ability) );
		if ( ability ) ability.system.descriptorsSpecial = [];
		
		const weapon = actor.items.get(data.weapon);
		const check = data.check;
		// MERGE ITEMS
		if ( weapon ) {
			switch (ability.type) {
				case 'ability':
				case 'spell':
				case 'sigil':
				case 'guild-ability':
					this.mergeAbilityItem(ability, weapon);
					break;
				default:
					break;
			}
		}
		if ( check ) {
			this.mergeAbilityCheck(ability, check);
		}
		console.log('posMERGE', createData);
		createData.targets = await ModificationConfig.getTargets(actor);
		console.log(createData);
		// PREPARE MODS
		createData.modifications = await this.getModifications(actor, ability, appliedMods);
		const {changes, cost} = await ModificationConfig.parseChanges(createData.modifications);
		
		// APPLY MODS TO ACTOR
		createData.actor = await this.applyModificationToActor(actor, changes);
		// APPLY MODS TO ITEM
		createData.item = await this.applyModificationToItem(ability, changes);
		// GET ITEM ROLLS
		const rolls = await this.getAbilityRolls(actor, ability);
		
		// APPLY MODS TO ROLLS
		console.log(rolls);
		createData.rolls = await this.applyModificationToRolls(rolls, changes);
		
		// APPLY MODS TO EFFECT
		createData.effects = await this.applyModificationToEffects(effects, changes);
		
		createData.actor = actor;
		createData.ability = ability;
		createData.cost = {
			ep: {
				base: ability.system.activation.cost ?? 0,
				mod: 0,
				limit: actor.system.proficiency,
			},
			quantity: [],
		};
		console.warn(createData.targets);
		return new this(createData, options);
	}

	async updateData(){
		console.log(this);
		// return;
		// GET TARGETS
		this.manage.targets = await ModificationConfig.getTargets(this.manage.actor);
		this.manage.cost = {
			ep: {
				base: this.manage.item?.system.activation.cost ?? 0,
				mod: 0,
				limit: this.manage.actor?.system.proficiency,
			},
			quantity: [],
		}
		
		// this.manage.modifications = await ModificationConfig.getModifications(
		// 	this.manage.actor, this.manage.ability, this.manage.modifications
		// );
		const {changes, cost} = await ModificationConfig.parseChanges(
			this.manage.modifications
		);
		for (const resource in cost) {
			this.manage.cost[resource].label = game.i18n.localize(`SKYFALL2.RESOURCE.${resource.toUpperCase()}Abbr`);
			if ( resource == 'ep') {
				this.manage.cost[resource].mod ??= 0;
				this.manage.cost[resource].mod += cost[resource];
			} else {
				this.manage.cost[resource] ??= 0;
				this.manage.cost[resource] += cost[resource];
			}
		}
		// APPLY MODS TO ACTOR
		await ModificationConfig.applyModificationToActor(
			this.manage.actor, changes
		);
		// APPLY MODS TO ITEM
		await ModificationConfig.applyModificationToItem(
			this.manage.ability, changes
		);
		// FIXME GET WEAPON ROLL

		// GET ITEM ROLLS
		const rolls = await ModificationConfig.getAbilityRolls(
			this.manage.actor, this.manage.ability
		);
		
		// APPLY MODS TO ROLLS
		this.manage.rolls = await ModificationConfig.applyModificationToRolls(
			rolls, changes
		);
		
		// APPLY MODS TO EFFECT
		this.manage.effects = await ModificationConfig.applyModificationToEffects(
			this.manage.effects, changes
		);
		
	}

	static getTargets(actor) {
		console.groupCollapsed('getTargets');
		console.log(actor);
		const token = fromUuidSync(actor.uuid)?.getActiveTokens()[0];
		console.warn(token);
		
		const targets = game.user.targets.toObject().map( i => {
			const data = {};
			data.uuid = i.document.uuid;
			data.name = i.document.name;
			data.protection = skyfall.utils.keyPairObject(i.document.actor.system.abilities, 'protection');
			data.statuses = i.document.actor.statuses;
			data.distance = game.canvas.grid.measurePath([token.position, i.position])?.distance ?? 0;
			data.token = i;
			return data;
		});
		console.warn(targets);
		console.groupEnd();
		return targets;
	}

	static mergeAbilityCheck(ability, check) {
		if ( check.type == 'skill') check.skill = check.id;
		check.ability = check.abl;
		ability.name = skyfall.utils.rollTitle(check);
		ability.system.descriptorsSpecial = [];
		ability.system.descriptorsSpecial.push(check.ability);
		ability.system.identifier = `check-${check.ability}`;
		if ( check.skill ) {
			const skill = ability.actor?.system.skills[check.skill];
			ability.skill = skill;
			ability.system.descriptorsSpecial.push('skill', check.skill);
			ability.system.identifier = `check-${check.ability}-${check.skill}`;
		}
		for (const [rollId, _roll] of Object.entries(ability.system.rolls)) {
			if ( !_roll.type == 'ability' ) continue;
			console.log('mergeAbilityCheck', _roll);
			_roll.terms.push(
				{expression: `@${check.abl}`, data: 'ability', flavor:'', source: ''}
			)
			if ( check.type == 'skill') {
				_roll.terms.push(
					{expression: `@${check.skill}`, data: 'skill', flavor:'', source: ''}
				)
			}
		}
		console.log('mergeAbilityCheck', ability.system.rolls)
	}

	static mergeAbilityItem(ability, secondary){
		switch (secondary.type) {
			case 'weapon':
			case 'shield':
				return this.mergeAbilityWeapon(ability, secondary);
				break;
			default:
				break;
		}
	}

	static mergeAbilityWeapon(ability, weapon){
		ability.weapon = weapon;
		ability.img = weapon.img;
		ability.system.consume.ammo = Boolean(weapon.system.consume.target);

		// 1console.error(ability.system.descriptors);

		ability.system.descriptors = [
			...ability.system.descriptors,
			...weapon.system.descriptors,
		];
		if( weapon.effects.length ) {
			ability.effects.push( weapon.effects );
		}
		if ( weapon.system.range ) {
			ability.system.range.value = weapon.system.range;
		}
		
		const isVersatile = weapon.system.descriptors.includes( d => d == 'versatile' );
		console.log(ability);
		for (const [rollId, _roll] of Object.entries(ability.system.rolls)) {
			if ( _roll.type == 'attack' ) {
				let r = Object.values(weapon.system.rolls).find( i => i.type == 'attack');
				_roll.terms.findSplice((i) => i.expression.startsWith('@weapon'), r.terms);
				_roll.terms = _roll.terms.flat();
			}
			if ( _roll.type == 'damage' ) {
				let r = Object.values(weapon.system.rolls).find( i => i.type == 'damage');
				_roll.terms.findSplice((i) => i.expression.startsWith('@weapon'), r.terms);
				_roll.terms = _roll.terms.flat();
			}
		}
		console.log(ability);
		console.log('fimMERGE', ability);
		// return ability; //new this({item: ability});
	}
	
	static async getAbilityRolls(actor, ability){
		const rolls = [];
		const RollData = foundry.utils.mergeObject(
			actor.getRollData(), ability.getRollData()
		);
		const damageType = ability.system.descriptors.find( d => SYSTEM.DESCRIPTOR.DAMAGE[d] );
		const isVersatile = ability.system.descriptors.includes( d => d == 'versatile' );

		const abilityRolls = ability.system.rolls;
		const descriptors = [...ability.system.descriptors, ...ability.system.descriptorsSpecial];
		for (const _roll of Object.values(abilityRolls)) {
			const bonuses = actor.system._getRollBonuses(_roll.type, descriptors);
			// 1console.error(bonuses, _roll.terms);
			const modifiers = actor.system._getRollModifiers(_roll.type, descriptors);
			if ( bonuses ) {
				_roll.terms.push(...bonuses);
			}
			if ( ['attack'].includes(_roll.type) ) {
				const roll = D20Roll.fromItemRoll(_roll, RollData, {});
				for (const term of roll.terms) {
					if ( !(term instanceof DiceTerm) ) continue;
					term.modifiers = [...new Set([...term.modifiers, ...modifiers]) ].flat();
					break;
				}
				rolls.push( roll );
			} else if ( ['damage'].includes(_roll.type) ) {
				const roll = SkyfallRoll.fromItemRoll(_roll, RollData, {});
				for (const term of roll.terms) {
					if ( !(term instanceof DiceTerm) ) continue;
					term.modifiers = [...new Set([...term.modifiers, ...modifiers]) ].flat();
					break;
				}
				rolls.push( roll );
			} else if ( ['ability'].includes(_roll.type) ) {
				const roll = D20Roll.fromItemRoll(_roll, RollData, {});
				for (const term of roll.terms) {
					if ( !(term instanceof DiceTerm) ) continue;
					term.modifiers = [...new Set([...term.modifiers, ...modifiers]) ].flat();
					break;
				}
				rolls.push( roll );
			}
		}
		return rolls;
	}

	static async getModifications(actor, item, applied){
		const modifications = {};
		// console.log(actor.allModifications);
		// console.log(item);
		// console.log(applied);
		
		
		for (const mod of actor.allModifications ) {
			const {itemName, itemType, descriptors, type, amplifyThreshold} = mod.system.apply;
			// console.log(itemName, itemType, descriptors);
			const names = new Set( itemName.split(';').map( n => n.trim() ));
			// const name = item.name;
			const name = [item.name, item.weapon?.name];
			const identifier = [item.system.identifier, item.weapon?.system?.identifier];
			const itemDescriptors = [...item.system.descriptors, ...item.system.descriptorsSpecial];

			// Ignore modifications if apply condition is not met;
			// if ( itemName && !itemName.split(';').map( n => n.trim() ).includes(item.name) ) continue;
			// console.log(names, name, identifier);
			// console.error("PRE NAMES");
			if ( names.filter(Boolean).size && names.every(n => !name.includes(n) && !identifier.includes(n)) ) continue;
			// if ( names.filter(Boolean).size && !names.has(name) && !names.has(identifier) ) continue;
			// 1console.error("PRE SELF");
			if ( itemType.includes('self') && mod.parent.id != item._id ) continue;
			// 1console.error("PRE !SELF");
			if ( !itemType.includes('self') && mod.parent.id == item._id ) continue;
			// 1console.error("PRE TYPE");
			if ( !foundry.utils.isEmpty(itemType) && !itemType.includes('self') && !itemType.includes(item.type) ) continue;
			// 1console.error("PRE DESCRIPTORS", descriptors, itemDescriptors );
			// 1console.error("PRE DESCRIPTORS", item.system.descriptors );
			if ( !foundry.utils.isEmpty(descriptors) && !descriptors.every( d => itemDescriptors.includes(d) ) ) continue;
			// 1console.error("PASSOU");
			
			const embed =  await mod.toEmbed({
				caption: false,
				controls: true,
			});
			if ( applied[mod.id] ) {
				modifications[mod.id] = applied[mod.id];
			} else {
				modifications[mod.id] = {
					_effect: mod,
					id: mod.id,
					uuid: mod.uuid,
					apply: (mod.system.apply.always ? 1 : 0),
					embed: embed.innerHTML,
					multiply: mod.system.cost.multiple,
					name: `${mod.parent.name}<br>[${mod.name}]`,
					description: mod.description,
					cost: mod.system.cost.value,
					resource: mod.system.cost.resource,
					isAmplify: type.includes('amplify') ? true : false,
					amplified: false,
					amplifyThreshold: amplifyThreshold,
				}
			}
		}
		return modifications;
	}
	
	static async parseChanges(modifications) {
		console.log(modifications);
		console.groupCollapsed("parseChanges");
		const changes = [];
		const cost = {};
		const typeCls = SYSTEM.modification;
		for (const modification of Object.values(modifications)) {
			if ( modification.apply == 0) continue;
			const _changes = modification._effect.changes.map(i => {
				console.log("change ini", i);
				const change = {
					original: i.key,
					mode: i.mode,
					value: i.value,
					priority: i.priority,
					apply: modification.apply,
					multiply: modification.multiply,
				}
				const [handler, key] = i.key.split('_');
				change.key = key;
				change.handler = handler;
				change.effect = modification._effect;
				if ( typeCls.actor.isValidModification.includes(handler) ){
					change.type = 'actor';
				} else if ( typeCls.item.isValidModification.includes(handler) ){
					change.type = 'item';
				} else if ( typeCls.effect.isValidModification.includes(handler) ){
					change.type = 'effect';
				} else if ( typeCls.roll.isValidModification.includes(handler) ){
					change.type = 'roll';
				} else change.type = 'invalid';
				console.log("change fin", change);
				return change;
			});
			
			changes.push(..._changes);
			cost[modification.resource] ??= 0;
			cost[modification.resource] += modification.apply * modification.cost;
		}
		changes.sort( (a, b) => a.priority - b.priority);
		console.log(changes);
		console.groupEnd();
		return {
			changes: changes,
			cost: cost,
		};
	}
	
	static async applyModificationToActor(actor, changes) {
		console.groupCollapsed("applyModificationToActor");
		SYSTEM.modification.actor.callApplyActor(actor, changes);
		console.groupEnd();
	}

	static async applyModificationToItem(item, changes) {
		console.groupCollapsed("applyModificationToItem");
		SYSTEM.modification.item.callApplyItem(item, changes);
		console.groupEnd();
	}

	static async applyModificationToRolls(rolls, changes) {
		console.groupCollapsed("applyModificationToRolls");
		for (const roll of rolls) {
			console.log(roll);
			SYSTEM.modification.roll.callApplyRoll(roll, changes);
		}
		console.groupEnd();
		console.log(rolls);
		return rolls;
	}

	static async applyModificationToEffects(effects, changes) {
		console.groupCollapsed("applyModificationToEffects");
		console.log(effects, changes);
		SYSTEM.modification.effect.callApplyEffect(effects, changes);
		console.groupEnd();
		return effects;
	}
	
	/* -------------------------------------------- */
	/*  Active Effect Preparation                   */
	/* -------------------------------------------- */
	
	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @override */
	async _prepareContext(options) {
		console.groupCollapsed("_prepareContext");
		const context = {
			SYSTEM: SYSTEM,
			data: this.manage,
			buttons: [
				{type: "submit", icon: "fas fa-check", label: "SKYFALL2.Confirm"},
				{type: "submit", action:"roll", icon: "fas fa-check", label: "SKYFALL2.APP.ConfirmRoll"},
			],
		}
		console.log(this);
		for (const modificationId in context.data.modifications) {
			const mod = context.data.modifications[modificationId];
			const div = document.createElement('div');
			div.innerHTML = mod.embed;
			const input = div.querySelector('.controls input');
			if ( input.type == 'checkbox' ) {
				if ( mod.apply ) input.setAttribute('checked', '');
				else input.removeAttribute('checked');
			} else input.setAttribute('value', mod.apply);
			
			mod.embed = div.innerHTML;
			console.log(mod);
		}
		console.groupEnd();
		return context;
	}

	/* -------------------------------------------- */
	/*  Actions                                     */
	/* -------------------------------------------- */

	static async #applyToggle(event, target) {
		const {modificationId} = target.dataset;
		console.log(modificationId, this.manage.modifications);
		const current = this.manage.modifications[modificationId].apply;
		this.manage.modifications[modificationId].apply = current ? 0 : 1;
		await this.updateData();
		this.render();
	}

	static async #applyVary(event, target) {
		console.log(this);
		const {modificationId, vary} = target.dataset;
		const input = target.closest('.controls').querySelector('input');
		if ( vary == '+' ) input.value = Number(input.value) + 1;
		else input.value = Number(input.value) - 1;
		if ( vary == '+' ) this.manage.modifications[modificationId].apply += 1;
		else this.manage.modifications[modificationId].apply -= 1;
		await this.updateData();
		this.render();
	}

	static async #onSubmit(event, form, formData) {
		const message = await this.createMessage();
		if ( event.submitter.dataset?.action == 'roll' ) {
			message.evaluateAll();
		}
		message.consumeResources();
	}

	async createMessage(){
		const data = this.manage;
		const cost = data.cost;
		data.measuredTemplate = data.ability.system.getMeasuredTemplate();
		data.effects = data.effects.map( i => {
			const ef = {
				_id: foundry.utils.randomID(),
			};
			foundry.utils.mergeObject(ef, i);
			return ef;
		});
		console.log(data.rolls);
		for (const [i, roll] of data.rolls.entries()) {
			roll.index = i;
			roll.template = await roll.render();
		}
		
		const messageData = {
			portrait: data.actor?.img,
			origin: {
				actor: data.actor.uuid,
				item: data.ability.uuid,
				ability: data.ability.id,
				weapon: data.ability.weapon?.id ?? null,
				feature: '',
				// item: '',
			},
			actor: data.actor,
			item: data.ability,
			modifications: Object.values(data.modifications).reduce( (acc, mod) => {
				if ( !mod.apply ) return acc;
				const div = document.createElement('div');
				div.innerHTML = mod.embed;
				const label = game.i18n.localize(`SKYFALL2.RESOURCE.${mod.resource.toUpperCase()}Abbr`);
				div.querySelector('.controls').innerHTML = `<span>${mod.cost * mod.apply} ${label}</span>`;
				acc[mod.id] = {
					_effect: mod._effect,
					id: mod.id,
					uuid: mod.uuid,
					apply: mod.apply,
					embed: div.innerHTML, //mod.embed,
					name: mod.name,
					description: mod.description,
					cost: mod.cost,
					resource: mod.resource,
					isAmplify: mod.isAmplify,
					amplified: mod.amplified,
					amplifyThreshold: mod.amplifyThreshold,
				}
				return acc;
			}, {}),
			rolls: data.rolls, //.map( i => ({original: i.original.toJSON(), evaluated: null})),
			targets: [],
			measuredTemplate: data.measuredTemplate,
			effects: data.effects, //.map( i => i.toJSON()),
			costs: {
				ep: (cost.ep.base + cost.ep.mod),
				quantity: [],
			}
		}

		if ( data.ability?.weapon ) {
			messageData.costs.quantity.push({
				id: data.ability.weapon.system.consume.target,
				path: 'system.quantity',
				value: -1,
			});
		}
		const template = "systems/skyfall/templates/v2/chat/usage.hbs";
		const content = await renderTemplate( template, messageData );
		
		// CREATE MESSAGE
		console.groupEnd();
		console.log(this);
		console.log('messageData', messageData);
		const message = await ChatMessage.create({
			type: 'usage',
			system: messageData,
			content: content,
		});
		return message;
	}
}