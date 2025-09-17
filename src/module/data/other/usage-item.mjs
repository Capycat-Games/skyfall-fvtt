import D20Roll from "../../dice/d20-roll.mjs";
import SkyfallRoll from "../../dice/skyfall-roll.mjs";

export default class UsageItem extends foundry.abstract.DataModel {
	
	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			actor: new fields.ObjectField(),
			item: new fields.ObjectField(),
			rolls: new fields.ArrayField(new fields.ObjectField()),
			modifications: new fields.ArrayField(new fields.ObjectField()),
			effects: new fields.ArrayField(new fields.ObjectField()),
		}
	}
		

	/* -------------------------------------------- */
	/*  Factory Methods                             */
	/* -------------------------------------------- */

	static async fromData(data){
		const { appliedMods, effects } = data;
		const createData = {}
		const actor = fromUuidSync(data.actor)?.clone({}, {keepId: true});
		const ability = actor.items.get(data.ability);
		const weapon = actor.items.get(data.weapon);
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
		createData.targets = game.user.targets.toObject().map( i => i.document.uuid);
		// PREPARE MODS
		createData.modifications = await this.getModifications(actor, ability, appliedMods);
		// APPLY MODS TO ACTOR
		createData.actor = await this.applyModificationToActor(actor, createData.modifications);
		// APPLY MODS TO ITEM
		createData.item = await this.applyModificationToItem(ability, createData.modifications);
		// GET ITEM ROLLS
		const rolls = await this.getAbilityRolls();
		return;
		// APPLY MODS TO ROLLS
		createData.rolls = await this.applyModificationToRolls(rolls, createData.modifications);
		// APPLY MODS TO EFFECT
		createData.effects = await this.applyModificationToEffects(effects, createData.modifications);
		
		return new this(createData);
	}

	/**
	 * Primary      The main item being used, usualy an ability.
	 * Secondary    Item that will be merged to the main one.
	 * @param {*} param0 
	 */
	static fromItem(primary, secondary = null) {
		if ( !secondary ) {
			return new this({item: primary});
		}
		switch (primary.type) {
			case 'ability':
			case 'spell':
			case 'sigil':
			case 'guild-ability':
				return this.mergeAbilityItem(primary, secondary);
				break;
			default:
				break;
		}
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
		for (const [rollId, _roll] of Object.entries(ability.system.rolls)) {
			if ( _roll.type == 'attack' ) {
				let r = Object.values(weapon.system.rolls).find( i => i.type == 'attack');
				_roll.terms.findSplice((i) => i.expression.startsWith('@weapon'), r.terms);
				_roll.terms = _roll.terms.flat();
				_roll.terms.unshift({
					expression: '1d20', flavor: '', data: '', source: 'd20'
				});
			}
			if ( _roll.type == 'damage' ) {
				let r = Object.values(weapon.system.rolls).find( i => i.type == 'damage');
				_roll.terms.findSplice((i) => i.expression.startsWith('@weapon'), r.terms);
				_roll.terms = _roll.terms.flat();
			}
		}
		// return ability; //new this({item: ability});
	}
	
	static async getAbilityRolls({advantage=false, disadvantage=false}){
		const item = this.item;
		const rolls = {listed: [], evaluated: []}
		const RollData = foundry.utils.mergeObject(
			this.actor.getRollData(), this.item.getRollData()
		);
		const damageType = item.system.descriptors.find( d => SYSTEM.DESCRIPTOR.DAMAGE[d] );
		const isVersatile = item.system.descriptors.includes( d => d == 'versatile' );

		const abilityRolls = item.system.rolls;
		for (const _roll of abilityRolls) {
			if ( _roll.type == 'attack' ) {

			}
		}
	}

	getAbilityRolls2({advantage, disadvantage}){
		const item = this.item;
		const rolls = {listed: [], evaluated: []}
		const RollData = foundry.utils.mergeObject(
			this.actor.getRollData(), this.item.getRollData()
		);
		const damageType = item.system.descriptors.find( d => SYSTEM.DESCRIPTOR.DAMAGE[d] );
		const isVersatile = item.system.descriptors.includes( d => d == 'versatile' );
		if ( item.system.attack.ability ) {
			const attack = item.system.getAttack({
				RollData: RollData,
				weapon: item.weapon,
				advantage: advantage ?? 0,
				disadvantage: disadvantage ?? 0,
			});
			const roll = D20Roll.fromSkyfallTerms(attack.terms, RollData, attack.options);
			rolls.listed.push( roll );
		}
		if ( item.system.attack.damage ) {
			const damage = item.system.getDamage({
				RollData: RollData,
				weapon: item.weapon,
				damageType: damageType,
				versatile: false,
			});
			const roll = SkyfallRoll.fromSkyfallTerms(damage.terms, RollData, damage.options);
			rolls.listed.push( roll );
			if ( isVersatile ) {
				damage.versatile = true;
				const roll = SkyfallRoll.fromSkyfallTerms(damage.terms, RollData, damage.options);
				rolls.listed.push( roll );
			}
		}
		if ( item.system.effect.damage.formula ) {
			const roll = SkyfallRoll.fromSkyfallTerms([
				item.system.effect.damage.formula,
				...RollData.modifiers.roll.damage,
			], RollData, {type: 'damage'});
			rolls.listed.push( roll );
		}
		return rolls;
	}
	
	static async getModifications(actor, item, applied){
		const modifications = {};
		for (const mod of actor.allModifications ) {
			const {itemName, itemType, descriptors} = mod.system.apply;
			// Ignore modifications if apply condition is not met;
			if ( itemName && !itemName.split(',').map( n => n.trim() ).includes(item.name) ) continue;
			if ( itemType.includes('self') && mod.parent.id != item._id ) continue;
			if ( !foundry.utils.isEmpty(itemType) && !itemType.includes('self') && !itemType.includes(item.type) ) continue;
			if ( !foundry.utils.isEmpty(descriptors) && !descriptors.every( d => item.system.descriptors.includes(d) ) ) continue;
			const embed =  await mod.toEmbed({caption:false});
			modifications[mod.id] = {
				id: mod.id,
				uuid: mod.uuid,
				apply: (mod.system.apply.always ? 1 : (applied[mod.id]? applied[mod.id] : 0)),
				embed: embed.innerHTML,
				
				name: `${mod.parent.name}<br>[${mod.name}]`,
				description: mod.description,
				cost: mod.system.cost.value,
				resource: mod.system.cost.resource,
			}
		}
		return modifications;
	}

	async getModifications2(){
		const item = this.item;
		const actor = this.item.parent;
		const modifications = {};
		for (const mod of actor.allModifications ) {
			const {itemName, itemType, descriptors} = mod.system.apply;
			// Ignore modifications if apply condition is not met;
			if ( itemName && !itemName.split(',').map( n => n.trim() ).includes(item.name) ) continue;
			if ( itemType.includes('self') && mod.parent.id != item._id ) continue;
			if ( !foundry.utils.isEmpty(itemType) && !itemType.includes('self') && !itemType.includes(item.type) ) continue;
			if ( !foundry.utils.isEmpty(descriptors) && !descriptors.every( d => item.system.descriptors.includes(d) ) ) continue;
			const embed =  await mod.toEmbed({caption:false});
			modifications[mod.id] = {
				id: mod.id,
				uuid: mod.uuid,
				name: `${mod.parent.name}<br>[${mod.name}]`,
				description: mod.description,
				cost: mod.system.cost.value,
				resource: mod.system.cost.resource,
				apply: mod.system.apply.always ? 1 : 0,
				embed: embed.innerHTML,
			}
		}
		return modifications;
	}
	
	/* -------------------------------------------- */
	/*  Active Effect Preparation                   */
	/* -------------------------------------------- */
	


	/* -------------------------------------------- */
  /*  Active Effect Integration                   */
  /* -------------------------------------------- */

	
	static async applyModificationToActor(actor, modifications) {
		return;
		for (const modification of Object.values(modifications)) {
			for (const change of modification.changes) {
				
			}
		}
	}
	static async applyModificationToItem() {

	}
	static async applyModificationToRolls() {

	}
	static async applyModificationToEffects() {

	}
  /**
   * Apply an ActiveEffectChange to this field.
   * @param {*} value                  The field's current value.
   * @param {DataModel} model          The model instance.
   * @param {EffectChangeData} change  The change to apply.
   * @returns {*}                      The updated value.
   */
  applyChange(value, model, change) {
    return;
		const delta = this._castChangeDelta(change.value);
    switch ( change.mode ) {
      case CONST.ACTIVE_EFFECT_MODES.ADD: return this._applyChangeAdd(value, delta, model, change);
      case CONST.ACTIVE_EFFECT_MODES.MULTIPLY: return this._applyChangeMultiply(value, delta, model, change);
      case CONST.ACTIVE_EFFECT_MODES.OVERRIDE: return this._applyChangeOverride(value, delta, model, change);
      case CONST.ACTIVE_EFFECT_MODES.UPGRADE: return this._applyChangeUpgrade(value, delta, model, change);
      case CONST.ACTIVE_EFFECT_MODES.DOWNGRADE: return this._applyChangeDowngrade(value, delta, model, change);
    }
    return this._applyChangeCustom(value, delta, model, change);
  }
}