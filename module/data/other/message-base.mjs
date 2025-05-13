

/**
 * Data schema, attributes, and methods specific to Usage type ChatMessages.
 */
export default class BaseChatMessage extends foundry.abstract.TypeDataModel {

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			portrait: new fields.FilePathField({categories: ["IMAGE"], label: "SKYFALL.Portrait"}),
			origin: new fields.SchemaField({
				actor: new fields.StringField(),
				ability: new fields.StringField(),
				weapon: new fields.StringField(),
				feature: new fields.StringField(),
				item: new fields.StringField(),
			}),
			restUpdate: new fields.ObjectField(),
		}
	}
	
	async getDocuments(){
		return {
			actor: fromUuidSync(this.origin.actor),
			item: fromUuidSync(this.origin.item),
		}
	}

	async getChatContent(){
		this.MANAGER = {};
		
		const actor = fromUuidSync(this.origin.actor)?.clone({}, {keepId: true});
		if ( !actor ) return;
		
		const context = {};
		context.SYSTEM = SYSTEM;
		context.actor = actor;
		context.ability = actor?.items.get(this.origin.ability);
		if ( this.origin.weapon ) {
			context.weapon = actor?.items.get(this.origin.weapon);
			this.mergeAbilityWeapon( context.ability , context.weapon);
		}

		context.rolls = {list: [], evaluated: []};
		context.effects = SYSTEM;

		context.modifications = await this.getModifications(actor, context.ability);
		context.template = SYSTEM;
		context.hasCost = SYSTEM;
		return context;
	}

	mergeAbilityWeapon(ability, weapon){
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
		foundry.utils.mergeObject(ability.system.attack, weapon.system.attack);
		ability.system.attack.damage = {
			...weapon.system.damage,
			formula: ability.system.attack.damage,
		}
		ability.system.effect.damage = {
			...weapon.system.damage,
			formula: ability.system.effect.damage,
		}
		
		ability.effects.push
		return ability;
	}

	async getModifications(actor, item, applied){
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
}